const fs = require('fs');
const util = require('util');
const express = require('express');
const basicAuth = require('express-basic-auth');
const { exec } = require('child_process');
const { authenticate } = require('ldap-authentication');
require('dotenv').config();

async function auth(username, password, callback) {
    // auth with AD user
    options = {
        ldapOpts: {
            url: process.env.LDAP_URL,
            tlsOptions: { rejectUnauthorized: true }
        },
        userDn: `${username}@axis.com`,
        userPassword: password
    }

    try {
        var user = await authenticate(options);
    } catch (err) {
        console.log(err);
        var user = false;
    }
    console.log(user);

    if (user) return callback(null, true);
    else return callback(null, false);
}

const app = express();

var ldapAuth = basicAuth( {
    authorizer: auth,
    authorizeAsync: true,
    challenge: true
});

async function sshSigner(publicKey, res) {
    let path = 'keys/key.pub';
    console.log(path);

    fs.writeFile(path, publicKey, (err) => {
        if (err) throw err;
        console.log(`wrote ${publicKey}`);
    })

    let p = util.promisify(exec);

    let verifyKey = `ssh-keygen -l -f ${path}`
    try {
        await p(verifyKey);
    } catch (error) {
        res.status(200).send('public key provided is not a valid public key');
    }

    let certificateCmd = `ssh-keygen -s ca/ca_key -I "$(whoami)@$(hostname) user key" -n "$(whoami)" -V -5m:+${process.env.CERT_TTL} ${path}`;
    try {
        let result = await p(certificateCmd);
        console.log(result);
    } catch (error) {
        raise (error);
    }

    let data = fs.readFile('keys/key-cert.pub', 'utf-8', (err, data) => {
        if (err) raise (err);
        res.status(200).send(data);
    })
}

app.get('/', ldapAuth, async(req, res) => {

    // console.log(req.header('SSH-Key'));
    if(!req.header('SSH-key')) res.status(200).send('missing SSH-Key header. Example curl command:\n\n\tcurl -u username:password -H "SSH-Key: `cat ~/.ssh/id_rsa.pub`" localhost:8080')
    else {
        await sshSigner(req.header('SSH-Key'), res);
    }
});

app.listen(process.env.PORT, () => console.log('server ready'));
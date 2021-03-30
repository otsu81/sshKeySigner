# SSH Certificate Signer

This is a POC to prove it's easy to automate certificate signing. It probably shouldn't be used in production.

## Requirements
* NodeJS 15.0 or higher
* Host must have network access to the LDAP server, keep this in mind if the LDAP server is not accessible from the internet

## Installation
1. Clone the repository. Run `npm install`
2. Copy `.env.example`, modify and rename to `.env`. The cert TTL follows the OpenSSH validity interval format, see [the -V flag](https://man.openbsd.org/ssh-keygen.1).
3. Generate keys with filename `ca_keys` for use with the CA and put both the private and public key in the `ca/` directory. Example command: `ssh-keygen -f ca/ca_key`
4. Start the server with the command `node index`.

For this POC, the `ca/ca_key.pub` file can be used as the CA key in GitHub.


## Usage
The server uses basic HTTP auth and expects a public key in the header in the format
```json
{"SSH-Key": "public-key"}
```

Easiest way to provide this is with cURL. Example cURL command to run on your own machine, using the default .env.example port of 8080 and default location and file names for ssh keys:

```bash
curl -u username:password -H "SSH-Key: `cat ~/.ssh/id_rsa.pub`" localhost:8080
```

Response will be the `cert` file to be used together with the public key. Together with the example command you can write the output to `cert` file directly:

```bash
curl -u username:password -H "SSH-Key: `cat ~/.ssh/id_rsa.pub`" localhost:8080 > ~/.ssh/id_rsa-cert.pub
```

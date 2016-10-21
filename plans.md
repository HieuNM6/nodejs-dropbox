#Planning of Dropbox basic

### Client

- Every client has it own id by `node-uuid`.
- If open new client it will create new uid and save to current directory.
- Uid will contain in header of every request sent from client.
- Automatically call get request if any changed in current client directory.

### Server

- Every client will have an directory in server with folder named by client uid.


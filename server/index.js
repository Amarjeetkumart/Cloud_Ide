const http = require('http');
const express = require('express');
const fs = require('fs/promises');
const { Server : SocketServer } = require('socket.io');
const path = require('path');
const pty = require('node-pty');
const cors = require('cors');
const chokidar =require('chokidar');

//create a terminal
const ptyProcess = pty.spawn('bash', [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.env.INIT_CWD + '/user',
    env: process.env
});
//create a server
const app = express();
const server = http.createServer(app);
const io = new SocketServer({ 
    cors: {
        origin: '*',
    },
});
//allow cross origin requests
app.use(cors());
//serve static files
io.attach(server);

//cokidar is a file watcher
chokidar.watch('./user').on('all', (event, path) => {
    io.emit('fileRefresh', path);
  });

// if content changes in the file, it will be updated in the editor
chokidar.watch('./user').on('change', async (filePath) => {
    const content = await fs.readFile(filePath, 'utf-8');
    const relativePath = path.relative('./user', filePath);
    io.emit('file:update', { path: relativePath, content });
});

//if terminal data changes, it will be updated in the terminal
ptyProcess.onData((data) => {
    io.emit('terminal:data', data);
});

//all schocket settings are here
io.on('connection', (socket) => {
    console.log('socket connection', socket.id);
//if file is written, it will be updated in the editor
    socket.on('file:write', async ({ path, content }) => {
        await fs.writeFile(`./user/${path}`, content);
//if file is updated, it will be updated in the editor
        io.emit('file:update', { path, content });
    });
//if terminal data is written, it will be updated in the terminal
    socket.on('terminal:write', (data) => {
        ptyProcess.write(data);
    });
});
//get file tree
app.get('/files', async (req, res) => {
    const fileTree = await generateFileTree('./user');
    return res.json({ tree: fileTree});
});
//get file content
app.get('/files/content', async (req, res) => {
    // const path  = req.query.path;
    const filePath = path.join('./user', req.query.path);
//read file content
    const content = await fs.readFile(filePath, 'utf-8');
    return res.json({ content });
});

// all http settings are here
server.listen(3000, () => {
  console.log('🐳 Docker server running on port 3000');
});

//generate file tree
async function generateFileTree(directory) {
    const tree = {}
//build tree
    async function buildTree(currentDir, currentTree) {
        const files = await fs.readdir(currentDir)

//for each file in the directory
        for (const file of files) {
            const filePath = path.join(currentDir, file)
            const stat = await fs.stat(filePath)
//if file is a directory, create a new tree
            if (stat.isDirectory()) {  
                currentTree[file] = {}
                await buildTree(filePath, currentTree[file])
            } else {
                currentTree[file] = null
            }
        }
    }
    await buildTree(directory, tree);
    return tree;
}

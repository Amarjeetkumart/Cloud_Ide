import {Terminal as XTerminal}  from '@xterm/xterm';
import { useEffect, useRef } from 'react';
import socket from '../socket';
import '@xterm/xterm/css/xterm.css';

// Terminal component
const Terminal = () => {
  
    const terminalRef = useRef(null);
    const isrendered = useRef(false);

    useEffect(() => {
        if (isrendered.current) {
            return;
        }
        isrendered.current = true;
        const terminal = new XTerminal({
            cursorBlink: true,
            cursorStyle: 'underline',
            fontSize: 14,
            rows: 20,
            cols: 80,
            theme: {
                background: '#000',
                foreground: '#fff'

            },
            lineHeight: 1.2,
        });
        terminal.open(terminalRef.current);
        // terminal.write('Hello from xterm.js');
        terminal.onData(data => {
            socket.emit('terminal:write', data);
        });
        
        socket.on('terminal:data', data => {
            terminal.write(data);
        });
        }, []);
        return(
             <div ref={terminalRef} id='terminal' />
            );
};



export default Terminal;
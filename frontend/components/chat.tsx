import React, { useState, useEffect, useRef } from 'react';

interface ChatProps {
  username: string;
}

const Chat: React.FC<ChatProps> = ({ username }) => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<{ username: string, message: string, timestamp: string, type: 'text' | 'image' | 'audio' }[]>([]);
  const [input, setInput] = useState('');
  const [isAskingUsername, setIsAskingUsername] = useState<boolean>(!username);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  useEffect(() => {
    if (username) {
      const socket = new WebSocket(`wss://${window.location.host}/api/ws/chat/`);
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setMessages(prev => [...prev, data]);
      };
      setWs(socket);

      return () => {
        socket.close();
      };
    }
  }, [username]);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const sendMessage = (type: 'text' | 'image' | 'audio', content: string) => {
    if (ws && username) {
      const timestamp = new Date().toLocaleString();
      ws.send(JSON.stringify({ username, message: content, timestamp, type }));
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage('text', input);
    }
  };

  const handleImageFromCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    const video = document.createElement('video');
    video.srcObject = stream;
    await video.play();
    await new Promise(resolve => setTimeout(resolve, 500));
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    stream.getTracks().forEach(track => track.stop());
    sendMessage('image', canvas.toDataURL('image/png'));
  };

  const handleImageFromAlbum = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        sendMessage('image', reader.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);
    mediaRecorder.current.addEventListener('dataavailable', event => {
      audioChunks.current.push(event.data);
    });
    mediaRecorder.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
      mediaRecorder.current.addEventListener('stop', () => {
        const audioBlob = new Blob(audioChunks.current);
        audioChunks.current = [];
        sendMessage('audio', URL.createObjectURL(audioBlob));
        setIsRecording(false);
      });
    }
  };

  return (
    <div className='chatBox h-full flex flex-col'>
      <div className='chatBox_div flex-1 overflow-y-auto'>
        {messages.map((msg, index) => (
          <div key={index} className={`chatItem_div p-2 m-5 w-10/12 rounded-lg ${msg.username === username ? 'ml-auto bg-blue-100' : 'mr-auto bg-green-100'}`}>
            <p className='chatItem_header font-bold'>
              {msg.username} ({msg.timestamp})
            </p>
            {msg.type === 'text' && (
              <p className='chatItem_content'>{msg.message}</p>
            )}
            {msg.type === 'image' && (
              <img src={msg.message} alt="User uploaded" className="max-w-full" />
            )}
            {msg.type === 'audio' && (
              <audio src={msg.message} controls />
            )}
          </div>
        ))}
      </div>
      <div className='chatBox_input p-5 m-5 inset-x-0 bottom-0 bg-white flex items-center'>
        <input
          className='input input-bordered w-full mr-2'
          placeholder="Message"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button onClick={() => sendMessage('text', input)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mr-2">
          Send
        </button>
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            +
          </button>
        </div>
      </div>
      {isDropdownOpen && (
        <>
          <div 
            className="fixed inset-0 flex items-center justify-center z-40 bg-opacity-75 bg-slate-700"
            onClick={() => setIsDropdownOpen(false)}
          >
            <div className="bg-white p-4 rounded shadow-lg">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleImageFromCamera();
                  setIsDropdownOpen(false)
                }}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mb-2 w-full"
              >
                Camera
              </button>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFromAlbum}
                className="hidden"
                id="albumInput"
              />
              <label
                htmlFor="albumInput"
                onClick={(e) => e.stopPropagation()}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mb-2 w-full block text-center cursor-pointer"
              >
                Album
              </label>
              <button
                onMouseDown={(e) => {
                  e.stopPropagation();
                  startRecording();
                }}
                onMouseUp={(e) => {
                  e.stopPropagation();
                  stopRecording();
                  setIsDropdownOpen(false);
                }}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              >
                {isRecording ? 'Recording...' : 'Press to record'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Chat;

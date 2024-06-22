import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import emergencyPoints from '../../dummydata/emergencyPoints';
import Chat from '@/components/chat';

const AccidentMap = dynamic(() => import('../../components/AccidentMap'), {
  ssr: false,
});

interface EmergencyData {
  title: string;
  id: number;
  incident: string;
  time: string;
  position: { lat: number; lng: number };
}

const AccidentPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState<EmergencyData | null>(null);

  useEffect(() => {
    if (id) {
      console.log("ID:", id);
      const point = emergencyPoints.find(point => point.data.id === Number(id));
      console.log("Point:", point);
      setData(point ? { ...point.data, position: point.position } : null);
    }
  }, [id]);

  const [activeTab, setActiveTab] = useState(0);

  const handleTabClick = (index: number) => {
    setActiveTab(index);
  };

  if (!data) {
    return <div>Loading...</div>;
  }

  return (
    <div className="grid grid-cols-6 h-screen">
      <div className="col-span-2 bg-gray-100 p-4 mx-2 my-4 rounded-lg overflow-y-auto">
        <div className="tab">
            <ul className="tab-list">
              {['OverView', 'Chat'].map((tab, index) => (
                <li
                  key={tab}
                  className={`tab-item ${index === activeTab ? 'active' : ''}`}
                  onClick={() => handleTabClick(index)}
                >
                  {tab}
                </li>
              ))}
            </ul>
            <div className="tab-content">
              <div className={`tab-pane ${activeTab === 0 ? 'active' : ''}`}>
                <h2 className="text-xl font-bold mb-4">{data.title}</h2>
                  <ul>
                    <li className="mb-2">accident ID: {data.id}</li>
                    <li className="mb-2">incident: {data.incident}</li>
                    <li className="mb-2">time: {data.time}</li>
                  </ul>
              </div>
              <div className={`tab-pane ${activeTab === 1 ? 'active' : ''}`}>
                <h2 className="text-xl font-bold mb-4">Chat</h2>
                <Chat username="Dispatcher"/>
              </div>
            </div>
        </div>
      </div>
      <div className="col-span-4 bg-white p-4">
        <AccidentMap position={data.position} />
      </div>
    </div>
  );
};

export default AccidentPage;

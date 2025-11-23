import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function MediaTeam() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    supabase.from('tasks').select('*').then(({ data }) => setTasks(data || []));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Media Team - Zadania</h1>
      <div className="grid grid-cols-3 gap-6">
        {['todo', 'in-progress', 'done'].map(status => (
          <div key={status} className="bg-gray-100 p-4 rounded-lg min-h-[400px]">
            <h3 className="font-bold mb-4">{status}</h3>
            {tasks.filter(t => t.status === status).map(task => (
              <div key={task.id} className="bg-white p-4 rounded shadow mb-3">
                <h4 className="font-bold">{task.title}</h4>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

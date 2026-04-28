import { createContext, useContext, useState, useCallback } from 'react';
import { taskAPI } from '../services/api';
import toast from 'react-hot-toast';

const TaskContext = createContext(null);

export function TaskProvider({ children }) {
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [total,   setTotal]   = useState(0);

  const fetchTasks = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const { data } = await taskAPI.getAll(params);
      setTasks(data.tasks);
      setTotal(data.total);
      return data;
    } catch (err) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = useCallback(async (taskData) => {
    const { data } = await taskAPI.create(taskData);
    setTasks(prev => [data.task, ...prev]);
    setTotal(prev => prev + 1);
    toast.success('Task created!');
    return data.task;
  }, []);

  const updateTask = useCallback(async (id, updates) => {
    const { data } = await taskAPI.update(id, updates);
    setTasks(prev => prev.map(t => t._id === id ? data.task : t));
    toast.success('Task updated!');
    return data.task;
  }, []);

  const deleteTask = useCallback(async (id) => {
    await taskAPI.delete(id);
    setTasks(prev => prev.filter(t => t._id !== id));
    setTotal(prev => prev - 1);
    toast.success('Task deleted');
  }, []);

  const completeTask = useCallback(async (id) => {
    const { data } = await taskAPI.complete(id);
    setTasks(prev => prev.map(t => t._id === id ? data.task : t));
    toast.success('✅ Task completed!');
    return data.task;
  }, []);

  return (
    <TaskContext.Provider value={{
      tasks, loading, total,
      fetchTasks, createTask, updateTask, deleteTask, completeTask, setTasks,
    }}>
      {children}
    </TaskContext.Provider>
  );
}

export const useTask = () => {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTask must be inside TaskProvider');
  return ctx;
};

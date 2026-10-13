import React, { useEffect, useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

export type DeskTask = {
  id: number;
  title: string;
  detail: string | null;
  status: 'open' | 'done';
  priority: 'low' | 'normal' | 'high';
  due_date: string | null;
  created_at: string;
};

const priorityLabel: Record<DeskTask['priority'], string> = {
  high: 'High',
  normal: 'Normal',
  low: 'Low',
};

const Tasks = () => {
  const [tasks, setTasks] = useState<DeskTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<DeskTask['priority']>('normal');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/tasks')
      .then(setTasks)
      .catch((err) => setError(err.message || 'Could not load tasks'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const addTask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError('');
    try {
      const created = await api.post('/tasks', { title: title.trim(), priority, dueDate: dueDate || null });
      setTasks((current) => [created, ...current.filter((task) => task.id !== created.id)]);
      setTitle('');
      setDueDate('');
      setPriority('normal');
    } catch (err: any) {
      setError(err.message || 'Could not add the task');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (task: DeskTask) => {
    const next = task.status === 'open' ? 'done' : 'open';
    const updated = await api.put(`/tasks/${task.id}`, { status: next });
    setTasks((current) => current.map((item) => (item.id === task.id ? updated : item)));
  };

  const remove = async (task: DeskTask) => {
    await api.delete(`/tasks/${task.id}`);
    setTasks((current) => current.filter((item) => item.id !== task.id));
  };

  const open = tasks.filter((task) => task.status === 'open');
  const done = tasks.filter((task) => task.status === 'done');

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">Follow-ups</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Desk tasks</h1>
        <p className="mt-1 text-sm text-muted-foreground">Shared work for the team. Check something off when it is finished.</p>
      </div>

      <form onSubmit={addTask} className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[1fr_140px_160px_auto]">
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Call the client about the renewal"
          className="h-10"
        />
        <select
          value={priority}
          onChange={(event) => setPriority(event.target.value as DeskTask['priority'])}
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
        <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="h-10" />
        <Button type="submit" disabled={saving || !title.trim()} className="h-10">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </form>

      {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
        </div>
      ) : open.length === 0 && done.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <p className="text-sm font-medium">The desk is clear</p>
          <p className="mt-1 text-sm text-muted-foreground">Add a follow-up so it does not live in someone’s head.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <TaskList title="Open" tasks={open} onToggle={toggle} onRemove={remove} />
          {done.length > 0 && <TaskList title="Done" tasks={done} onToggle={toggle} onRemove={remove} muted />}
        </div>
      )}
    </div>
  );
};

function TaskList({
  title,
  tasks,
  onToggle,
  onRemove,
  muted = false,
}: {
  title: string;
  tasks: DeskTask[];
  onToggle: (task: DeskTask) => void;
  onRemove: (task: DeskTask) => void;
  muted?: boolean;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</h2>
      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {tasks.map((task) => (
          <li key={task.id} className="flex items-center gap-3 px-4 py-3">
            <button
              type="button"
              aria-label={task.status === 'done' ? 'Mark open' : 'Mark done'}
              onClick={() => onToggle(task)}
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                task.status === 'done' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 dark:border-zinc-600'
              }`}
            >
              {task.status === 'done' && <Check className="h-3 w-3" />}
            </button>
            <div className="min-w-0 flex-1">
              <p className={`truncate text-sm font-medium ${muted ? 'text-muted-foreground line-through' : ''}`}>{task.title}</p>
              <p className="text-xs text-muted-foreground">
                {priorityLabel[task.priority]}
                {task.due_date ? ` · Due ${String(task.due_date).slice(0, 10)}` : ''}
              </p>
            </div>
            <button type="button" aria-label="Delete task" onClick={() => onRemove(task)} className="text-slate-400 hover:text-rose-600">
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default Tasks;

import React from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import KanbanColumn from './KanbanColumn';
import useUIStore from '../../store/uiStore';
import { taskService } from '../../services/taskService';

const COLUMNS = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

const KanbanBoard = ({ organizationId, projectId, tasks, setTasks, setError }) => {
  const { setSelectedTaskId } = useUIStore();

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    // Dropped outside the list
    if (!destination) return;

    // Dropped in the same position
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    // Save previous state for rollback
    const previousTasks = [...tasks];

    // Calculate new position
    const sourceColumn = source.droppableId;
    const destColumn = destination.droppableId;
    
    // Find task
    const taskIndex = tasks.findIndex(t => t._id === draggableId);
    if (taskIndex === -1) return;
    
    const task = tasks[taskIndex];

    // Optismistic update
    const newTasks = [...tasks];
    
    // Get tasks in destination column sorted by position
    const destTasks = newTasks
      .filter(t => t.status === destColumn && t._id !== draggableId)
      .sort((a, b) => a.position - b.position);

    // Calculate position
    let newPosition;
    if (destTasks.length === 0) {
      newPosition = 1000;
    } else if (destination.index === 0) {
      newPosition = destTasks[0].position / 2;
    } else if (destination.index >= destTasks.length) {
      newPosition = destTasks[destTasks.length - 1].position + 1000;
    } else {
      const prev = destTasks[destination.index - 1].position;
      const next = destTasks[destination.index].position;
      newPosition = prev + (next - prev) / 2;
    }

    // Update locally
    newTasks[taskIndex] = { ...task, status: destColumn, position: newPosition };
    setTasks(newTasks);

    // Update backend
    try {
      await taskService.updateTaskPosition(organizationId, projectId, draggableId, destColumn, newPosition);
    } catch (err) {
      // Rollback on failure
      setTasks(previousTasks);
      setError(err.response?.data?.message || 'Failed to update task position. Rolling back.');
      setTimeout(() => setError(''), 5000);
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex h-full gap-6 overflow-x-auto pb-4">
        {COLUMNS.map(status => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={tasks.filter(t => t.status === status).sort((a, b) => a.position - b.position)}
            onTaskClick={setSelectedTaskId}
          />
        ))}
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;

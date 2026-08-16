import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import KanbanCard from './KanbanCard';

const COLUMN_COLORS = {
  'TODO': 'bg-gray-100',
  'IN_PROGRESS': 'bg-blue-50',
  'IN_REVIEW': 'bg-purple-50',
  'DONE': 'bg-green-50'
};

const COLUMN_TITLES = {
  'TODO': 'To Do',
  'IN_PROGRESS': 'In Progress',
  'IN_REVIEW': 'In Review',
  'DONE': 'Done'
};

const KanbanColumn = ({ status, tasks, onTaskClick }) => {
  return (
    <div className={`flex flex-col w-72 flex-shrink-0 rounded-lg ${COLUMN_COLORS[status]}`}>
      <div className="px-4 py-3 border-b border-gray-200/50 flex justify-between items-center">
        <h3 className="font-semibold text-gray-700">{COLUMN_TITLES[status]}</h3>
        <span className="bg-white text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium shadow-sm border border-gray-200">
          {tasks.length}
        </span>
      </div>
      
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-3 min-h-[150px] transition-colors ${snapshot.isDraggingOver ? 'bg-gray-200/50' : ''}`}
          >
            {tasks.map((task, index) => (
              <KanbanCard 
                key={task._id} 
                task={task} 
                index={index} 
                onClick={() => onTaskClick(task._id)}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default KanbanColumn;

import React from 'react';
import { Draggable } from '@hello-pangea/dnd';

const KanbanCard = ({ task, index, onClick }) => {
  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`
            bg-white p-3 rounded-md shadow-sm border mb-3 cursor-pointer select-none
            ${snapshot.isDragging ? 'shadow-lg border-blue-400 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300 hover:shadow'}
          `}
          style={{ ...provided.draggableProps.style }}
        >
          <div className="flex justify-between items-start mb-2">
            <h4 className="text-sm font-medium text-gray-900 break-words flex-1 pr-2">{task.title}</h4>
          </div>
          
          <div className="flex flex-wrap gap-1 mb-3">
            <span className={`px-2 py-0.5 rounded text-[10px] font-medium
              ${task.priority === 'URGENT' ? 'bg-red-100 text-red-800' : 
                task.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' : 
                task.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-800' : 
                'bg-green-100 text-green-800'}`}>
              {task.priority}
            </span>
            {task.labels?.slice(0, 2).map((label, i) => (
              <span key={i} className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] font-medium truncate max-w-[60px]">
                {label}
              </span>
            ))}
            {task.labels?.length > 2 && (
              <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] font-medium">
                +{task.labels.length - 2}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center">
              {task.assignedTo ? (
                <div className="flex items-center" title={task.assignedTo.name}>
                  <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-800 font-bold text-[10px]">
                    {task.assignedTo.name.charAt(0).toUpperCase()}
                  </div>
                </div>
              ) : (
                <span className="italic text-gray-400">Unassigned</span>
              )}
            </div>
            
            {task.dueDate && (
              <div className={`flex items-center ${new Date(task.dueDate) < new Date() && task.status !== 'DONE' ? 'text-red-500 font-medium' : ''}`}>
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default KanbanCard;

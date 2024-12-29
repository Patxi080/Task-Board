// /src/components/Column.tsx

import { App, moment as _moment } from 'obsidian';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { deleteTaskFromFile, deleteTaskFromJson, updateTaskInFile, updateTaskInJson } from 'src/utils/TaskItemUtils';
import { moveFromCompletedToPending, moveFromPendingToCompleted } from 'src/utils/TaskItemUtils';
import { taskItem, taskJsonMerged } from 'src/interfaces/TaskItemProps';

import { AddOrEditTaskModal } from "src/modal/AddOrEditTaskModal";
import { CSSProperties } from 'react';
import { ColumnProps } from '../interfaces/ColumnProps';
import { DeleteConfirmationModal } from '../modal/DeleteConfirmationModal';
import { EditButtonMode } from 'src/interfaces/GlobalSettings';
import TaskItem from './TaskItem';
import { t } from 'src/utils/lang/helper';

type CustomCSSProperties = CSSProperties & {
	'--column-width': string;
};

const Column: React.FC<ColumnProps> = ({
	app,
	plugin,
	columnIndex,
	activeBoardIndex,
	columnData,
	tasksForThisColumn,
}) => {
	// Local tasks state, initially set from external tasks
	// const [tasks, setTasks] = useState<taskItem[]>(tasksForThisColumn);
	const tasks = useMemo(() => tasksForThisColumn, [tasksForThisColumn]);
	const globalSettings = plugin.settings.data.globalSettings;
	console.log("Column.tsx : Data in tasks :", tasks);

	// // Sync local tasks state with external tasks when they change
	// useEffect(() => {
	// 	setTasks(tasksForThisColumn);
	// }, [tasksForThisColumn]);

	// // Render tasks using the tasks passed from KanbanBoard
	// useEffect(() => {
	// 	if (allTasksExternal.Pending.length > 0 || allTasksExternal.Completed.length > 0) {
	// 		renderColumns(plugin, setTasks, activeBoardIndex, colType, columnData, allTasksExternal);
	// 	}
	// }, [colType, columnData, allTasksExternal]);

	const handleCheckboxChange = (updatedTask: taskItem) => {

		// const updatedTasks = tasks.filter(t => t.id !== updatedTask.id);
		// setTasks(updatedTasks); // This two lines were not required at all since, anyways the `writeDataToVaultFiles` is running and sending and refresh emit signal.

		// Check if the task is completed
		if (updatedTask.completed) {
			const taskWithCompleted = { ...updatedTask, completed: "" };
			// Move from Completed to Pending
			moveFromCompletedToPending(plugin, taskWithCompleted);
			updateTaskInFile(plugin, taskWithCompleted, taskWithCompleted);
		} else {
			const moment = _moment as unknown as typeof _moment.default;
			const taskWithCompleted = { ...updatedTask, completed: moment().format(globalSettings?.taskCompletionDateTimePattern), };
			// Move from Pending to Completed
			moveFromPendingToCompleted(plugin, taskWithCompleted);
			updateTaskInFile(plugin, taskWithCompleted, taskWithCompleted);
		}
		// NOTE : The eventEmitter.emit("REFRESH_COLUMN") is being sent from the moveFromPendingToCompleted and moveFromCompletedToPending functions, because if i add that here, then all the things are getting executed parallely instead of sequential.
	};

	const handleSubTasksChange = (updatedTask: taskItem) => {
		updateTaskInJson(plugin, updatedTask);
		updateTaskInFile(plugin, updatedTask, updatedTask);
	};

	const handleDeleteTask = (app: App, task: taskItem) => {
		const mssg = t(61);
		const deleteModal = new DeleteConfirmationModal(app, {
			app,
			mssg,
			onConfirm: () => {
				deleteTaskFromFile(plugin, task);
				deleteTaskFromJson(plugin, task);
				// Remove the task from state after deletion
				// setTasks((prevTasks) => prevTasks.filter(t => t.id !== task.id)); // This line were not required at all since, anyways the `writeDataToVaultFiles` is running and sending and refresh emit signal.
			},
			onCancel: () => {
				// console.log('Task deletion canceled');
			}
		});
		deleteModal.open();
	};

	const handleEditTask = (task: taskItem) => {
		if (plugin.settings.data.globalSettings.editButtonAction === EditButtonMode.PopUp) {
			const editModal = new AddOrEditTaskModal(
				app,
				plugin,
				(updatedTask) => {
					updatedTask.filePath = task.filePath;
					// Update the task in the file and JSON
					updateTaskInFile(plugin, updatedTask, task);
					updateTaskInJson(plugin, updatedTask);

					// setTasks((prevTasks) =>
					// 	prevTasks.map((task) =>
					// 		task.id === updatedTask.id ? { ...task, ...updatedTask } : task
					// 	)
					// );
					// NOTE : The eventEmitter.emit("REFRESH_COLUMN") is being sent from the updateTaskInJson function, because if i add that here, then all the things are getting executed parallely instead of sequential.
				},
				task.filePath,
				task);
			editModal.open();
		} else if (plugin.settings.data.globalSettings.editButtonAction === EditButtonMode.NoteInTab) {
			const getFile = plugin.app.vault.getFileByPath(task.filePath);
			if (getFile) {
				plugin.app.workspace.getLeaf("tab").openFile(getFile)
			}
		} else if (plugin.settings.data.globalSettings.editButtonAction === EditButtonMode.NoteInSplit) {
			const getFile = plugin.app.vault.getFileByPath(task.filePath);
			if (getFile) {
				plugin.app.workspace.getLeaf("split").openFile(getFile)
			}
		} else if (plugin.settings.data.globalSettings.editButtonAction === EditButtonMode.NoteInWindow) {
			const getFile = plugin.app.vault.getFileByPath(task.filePath);
			if (getFile) {
				plugin.app.workspace.getLeaf("window").openFile(getFile)
			}
		} else {
			// markdownButtonHoverPreviewEvent(app, event, task.filePath);
		}
	};

	const handleTaskInteraction = useCallback(
		(task: taskItem, type: string) => {
			if (type === "edit") handleEditTask(task);
			else if (type === "delete") handleDeleteTask(app, task);
			else if (type === "checkbox") handleCheckboxChange(task);
		},
		[handleEditTask, handleDeleteTask, handleCheckboxChange, app]
	);

	const columnWidth = plugin.settings.data.globalSettings.columnWidth || '273px';
	const activeBoardSettings = plugin.settings.data.boardConfigs[activeBoardIndex];

	return (
		<div className="TaskBoardColumnsSection" style={{ '--column-width': columnWidth } as CustomCSSProperties}>
			<div className="taskBoardColumnSecHeader">
				<div className="taskBoardColumnSecHeaderTitleSec">
					{/* <button className="columnDragIcon" aria-label='More Column Options' ><RxDragHandleDots2 /></button> */}
					<div className="columnTitle">{columnData.name}</div>
				</div>
				{/* <RxDotsVertical /> */}
			</div>
			<div className={`tasksContainer${plugin.settings.data.globalSettings.showVerticalScroll ? '' : '-SH'}`}>
				{tasks.length > 0 ? (
					tasks.map((task, index = task.id) => {
						const shouldRenderTask = parseInt(activeBoardSettings.filterPolarity || "0") === 1 &&
							task.tags.some((tag: string) => activeBoardSettings.filters?.includes(tag));

						if (shouldRenderTask || parseInt(activeBoardSettings.filterPolarity || "0") === 0) {
							return (
								<TaskItem
									key={index}
									app={app}
									plugin={plugin}
									taskKey={index}
									task={task}
									columnIndex={columnIndex}
									activeBoardSettings={activeBoardSettings}
									onEdit={(task) => handleTaskInteraction(task, "edit")}
									onDelete={() => handleTaskInteraction(task, "delete")}
									onCheckboxChange={() =>
										handleTaskInteraction(task, "checkbox")
									}
									onSubTasksChange={(updatedTask) =>
										handleSubTasksChange(updatedTask)
									}
								/>
							);
						}

						return null;
					})
				) : (
					<p>{t(7)}</p>
				)}
			</div>
		</div>
	);

};

export default memo(Column);

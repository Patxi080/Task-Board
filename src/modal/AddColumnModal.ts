// /src/modal/AddColumnModal.ts

import { App, Modal } from "obsidian";

import { t } from "src/utils/lang/helper";

export type columnDataProp = {
	colType: string;
	name: string;
	active: boolean;
	range?: { tag: string; rangedata: { from: number; to: number } };
	coltag?: string;
	limit?: number;
};

interface AddColumnModalProps {
	app: App;
	onCancel: () => void;
	onSubmit: (columnData: columnDataProp) => void;
}

export class AddColumnModal extends Modal {
	private onSubmit: (columnData: {
		colType: string;
		name: string;
		active: boolean;
		range?: { tag: string; rangedata: { from: number; to: number } };
		coltag?: string;
		limit?: number;
	}) => void;
	private onCancel: () => void;
	private colType: string;
	private name: string;

	constructor(app: App, { onCancel, onSubmit }: AddColumnModalProps) {
		super(app);
		this.onCancel = onCancel; // Renamed
		this.onSubmit = onSubmit;
		this.colType = "undated";
		this.name = "";
	}

	onOpen() {
		const { contentEl } = this;

		this.modalEl.setAttribute("data-type", "task-board-view");
		contentEl.setAttribute("data-type", "task-board-view");

		const modalContent = contentEl.createDiv({
			cls: "addColumnModalOverlayContent",
		});

		// Header
		modalContent.createEl("h2", { text: t(56) });

		// Column Type Field
		const colTypeField = modalContent.createDiv({
			cls: "addColumnModalOverlayContentField",
		});
		colTypeField.createEl("label", {
			attr: { for: "colType" },
			text: t(10),
		});
		const colTypeSelect = colTypeField.createEl("select", {
			attr: { id: "colType" },
		});

		[
			{ value: "undated", text: t(11) },
			{ value: "dated", text: t(12) },
			{ value: "namedTag", text: t(13) },
			{ value: "untagged", text: t(14) },
			{ value: "otherTags", text: t(16) },
			{ value: "completed", text: t(15) },
		].forEach((option) => {
			colTypeSelect.createEl("option", {
				attr: { value: option.value },
				text: option.text,
			});
		});

		colTypeSelect.addEventListener("change", (event: Event) => {
			const target = event.target as HTMLSelectElement;
			this.colType = target.value;
		});

		// Name Field
		const nameField = modalContent.createDiv({
			cls: "addColumnModalOverlayContentField",
		});
		nameField.createEl("label", { attr: { for: "name" }, text: t(17) });
		const nameInput = nameField.createEl("input", {
			attr: { type: "text", id: "name", placeholder: t(20) },
		});
		nameInput.addEventListener("input", (event: Event) => {
			const target = event.target as HTMLInputElement;
			this.name = target.value;
		});

		// Action Buttons
		const actions = modalContent.createDiv({
			cls: "addColumnModalOverlayContentActions",
		});
		const submitButton = actions.createEl("button", { text: t(18) });
		submitButton.addEventListener("click", () => {
			const active = true;
			if(this.colType === "dated") {
				this.onSubmit({ colType: this.colType, name: this.name, active, range: { tag: "", rangedata: { from: 0, to: 0 } } }); // Add range data
			} else if(this.colType === "namedTag") {
				this.onSubmit({ colType: this.colType, name: this.name, active, coltag: "" }); // Add coltag
			} else if(this.colType === "completed") {
				this.onSubmit({ colType: this.colType, name: this.name, active, limit: 20 }); // Add limit
			} else {
				this.onSubmit({ colType: this.colType, name: this.name, active });
			}
			this.close();
		});

		const cancelButton = actions.createEl("button", { text: t(19) });
		cancelButton.addEventListener("click", () => {
			this.onCancel(); // Renamed from onClose to onCancel
			this.close();
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

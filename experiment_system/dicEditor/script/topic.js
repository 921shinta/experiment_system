import { showEditData } from "./_topicEdit.js";
import { enableTopicExportButton } from "./_topicFileExport.js";
import { setFileReader } from "./_topicFileRead.js";


export const DEBUG = {
	"general": true,
	"fileRead": true
}

export const pageData = {
	elemWordSelectControl_bcr: null,
	hoveredWordIndex: 0,
	editWordIndex: 0,
	isEdited: false,
	unsavedTime: 0
};
export const topicData = [];
const [
	elemWordSelectControl,
	elemWordSelectControlName,
	elemWordSelectControlSwitchOrder
] = [
	document.getElementById('wordSelectControl'),
	document.getElementById('wordSelectControl-name'),
	document.getElementById('wordSelectControl-switchOrder')
];

window.addEventListener("DOMContentLoaded", () => {
	// 初期動作
	if(DEBUG.general) console.log(Date());
	setFileReader();
	elemWordSelectControl.addEventListener('mouseleave', () => {
		elemWordSelectControl.classList.add('hidden');
	});
})

export function startEdit() {
	document.querySelector('.fileRead').remove();
	document.querySelector('.wordChoose').removeAttribute('hidden');
	document.getElementById('keySelect').removeAttribute('hidden');
	refreshWordSelect();
	showEditData(0);
	enableTopicExportButton();
}

export function refreshWordSelect() {
	const elemWordSelect = document.getElementById('wordSelectContent');
	let elemWordSelectContent = '';
	topicData.forEach(item => {
		elemWordSelectContent += `<li><button>${item.name}</button></li>`;
	});
	document.getElementById('wordSelectWrapper').removeAttribute('hidden');
	elemWordSelect.innerHTML = elemWordSelectContent;

	const elemsWordSelectButton = document.querySelectorAll('#wordSelectContent button');
	// console.log(elemsWordSelectButton);

	elemWordSelectControlSwitchOrder.setAttribute('max', elemsWordSelectButton.length);
	elemsWordSelectButton.forEach((elem, i) => {
		elem.addEventListener('mouseover', () => {
			// console.log(elem.innerText);
			let ebcr = elem.getBoundingClientRect();
			elemWordSelectControl.classList.remove('hidden');
			elemWordSelectControl.style.top = `${ebcr.top - ebcr.height + window.scrollY}px`;
			elemWordSelectControlName.innerText = elem.innerText;
			elemWordSelectControlSwitchOrder.value = i + 1;
			// console.log(i + 1);
			pageData.elemWordSelectControl_bcr = ebcr;
			pageData.hoveredWordIndex = i;
			// console.log(pageData);
		});
		elem.addEventListener('click', () => {
			showEditData(i);
		});
	});
}

window.setInterval(() => {
	if(pageData.isEdited) {
		pageData.unsavedTime++;
		let min = Math.floor(pageData.unsavedTime / 60);
		let sec = pageData.unsavedTime % 60;
		if(min < 10) {
			min = `0${min}`;
		}
		if(sec < 10) {
			sec = `0${sec}`;
		}
		document.querySelector('.unsavedTime span').innerText = `${min}:${sec}`;

		if(pageData.unsavedTime > 1 && pageData.unsavedTime % 600 == 1) {
			alert('そろそろ保存しませんか？');
		}
	}
}, 1000);
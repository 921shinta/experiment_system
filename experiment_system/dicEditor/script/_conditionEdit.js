import { conditionData, pageData, refreshWordSelect } from "./condition.js";

const elemsConditionKeyCheckbox = document.querySelectorAll('#keySelect input[type="checkbox"]');
const elemConditionValueControl = document.getElementById('conditionValueControl');
const elemConditionValueInput = document.getElementById('conditionValueControl-num');
// クリック・ホバー処理
elemsConditionKeyCheckbox.forEach(elem => {
	// クリック時、値の有無を確認
	let key = elem.id.split('-')[1];
	let elemLabel = document.querySelector(`[for="${elem.id}"]`);
	elem.addEventListener('change', () => {
		pageData.isEdited = true;
		// console.log(elem.id);
		// console.log(elem.checked);
		// console.log(`${key} => ${elem.checked}`);
		if(elem.checked) {
			let bcr = elemLabel.getBoundingClientRect();
			conditionData[pageData.editWordIndex].values[key] = 0;
			elemConditionValueControl.classList.remove('hidden');
			elemConditionValueControl.style.top = `${bcr.top + bcr.height / 2 - 16 + window.scrollY}px`;
			elemConditionValueControl.style.left = `${bcr.left + bcr.width / 2 - 31}px`;
			elemConditionValueControl.querySelector('h4').innerText = key;
			elemConditionValueInput.value = 0;
			changeinputStyle(0);
			elemConditionValueInput.focus();
		} else {
			delete conditionData[pageData.editWordIndex].values[key];
			elemConditionValueControl.classList.add('hidden');
		}
		// console.log(conditionData);
		document.getElementById('wordData').innerText = JSON.stringify(conditionData[pageData.editWordIndex].values);
	});

	// ONのとき、ホバーしたら値指定できるようにする
	elemLabel.addEventListener('mouseover', () => {
		pageData.selectedConditionKey = key;
		if(elem.checked) {
			elemConditionValueControl.classList.remove('hidden');
			let bcr = elemLabel.getBoundingClientRect();
			elemConditionValueControl.style.top = `${bcr.top + bcr.height / 2 - 16 + window.scrollY}px`;
			elemConditionValueControl.style.left = `${bcr.left + bcr.width / 2 - 31}px`;
			elemConditionValueControl.querySelector('h4').innerText = key;
			document.getElementById('conditionValueControl-num').value = conditionData[pageData.editWordIndex].values[key];
			changeinputStyle(conditionData[pageData.editWordIndex].values[key]);
			elemConditionValueInput.focus();
		} else {
			elemConditionValueControl.classList.add('hidden');
		}
	});
});

document.getElementById('conditionValueControl-noValue').addEventListener('click', () => {
	document.getElementById(`ks-${pageData.selectedConditionKey}`).checked = false;
	delete conditionData[pageData.editWordIndex].values[pageData.selectedConditionKey];
	elemConditionValueControl.classList.add('hidden');
	document.getElementById('wordData').innerText = JSON.stringify(conditionData[pageData.editWordIndex].values);
});

// 単語選択コントロール・新規
const elemWordSelectControlAdd = document.getElementById('wordSelectControl-add');
elemWordSelectControlAdd.addEventListener('click', () => {
	pageData.isEdited = true;
	const newWordObject = {
		'name': 'new',
		'values': new Object()
	};
	conditionData.splice(pageData.hoveredWordIndex + 1, 0, newWordObject);
	refreshWordSelect();
	showEditData(pageData.hoveredWordIndex + 1);
});

// 単語選択コントロール・削除
const elemWordSelectControlDelete = document.getElementById('wordSelectControl-delete');
elemWordSelectControlDelete.addEventListener('click', () => {
	pageData.isEdited = true;
	conditionData.splice(pageData.hoveredWordIndex, 1);
	refreshWordSelect();
	document.getElementById('wordSelectControl').classList.add('hidden');
});

// 単語選択コントロール・移動
const elemWordSelectControlMoveTo = document.getElementById('wordSelectControl-moveTo');
elemWordSelectControlMoveTo.addEventListener('click', () => {
	pageData.isEdited = true;
	let floatData = conditionData.splice(pageData.hoveredWordIndex, 1)[0];
	conditionData.splice(document.getElementById('wordSelectControl-switchOrder').value - 1, 0, floatData);
	refreshWordSelect();
	document.getElementById('wordSelectControl').classList.add('hidden');
});

// 編集画面・名前変更
const elemWordKeynameField = document.getElementById('wordKeyName');
elemWordKeynameField.addEventListener('change', () => {
	pageData.isEdited = true;
	conditionData[pageData.editWordIndex].name = elemWordKeynameField.value;
	refreshWordSelect();
});

// #MARK: データ切替
export function showEditData(editWordIndex) {
	document.getElementById('wordSelectControl').classList.add('hidden');
	pageData.editWordIndex = editWordIndex;
	const wordObject = conditionData[editWordIndex];
	console.log(wordObject);
	let conditionEntries = Object.entries(wordObject.values);
	document.querySelectorAll('#keySelect input[type="checkbox"]').forEach(elem => {
		elem.checked = false;
	});
	conditionEntries.forEach(entry => {
		let elemCheckbox = document.getElementById(`ks-${entry[0]}`);
		if(elemCheckbox) {
			elemCheckbox.checked = true;
		}
	});
	document.getElementById('wordKeyName').value = wordObject.name;
	document.getElementById('wordData').innerText = JSON.stringify(conditionData[pageData.editWordIndex].values);
}

// #MARK: 値の編集
elemConditionValueInput.addEventListener('keydown', (e) => {
	pageData.isEdited = true;
	let currentValue = elemConditionValueInput.value;
	// console.log(conditionData[pageData.editWordIndex].values[pageData.selectedConditionKey]);
	if(conditionData[pageData.editWordIndex].values[pageData.selectedConditionKey] != undefined) {
		if(isNaN(currentValue)) {
			currentValue = 0;
		} else {
			currentValue = Number(currentValue);
		}
		let newValue = 0;
		// console.log(conditionData[pageData.editWordIndex].name);
		// console.log(pageData.selectedConditionKey);
		// console.log(e.key);
		if(e.key == 'ArrowUp') {
			newValue = currentValue + 1;
		} else if(e.key == 'ArrowDown') {
			newValue = currentValue - 1;
		} else if(e.key == 'ArrowLeft') {
			newValue = currentValue - 0.1;
		} else if(e.key == 'ArrowRight') {
			newValue = currentValue + 0.1;
		} else {
			console.log(e.key);
		}
		changeinputStyle(newValue);
		newValue = Number(newValue.toFixed(1));
		elemConditionValueInput.value = newValue;
		conditionData[pageData.editWordIndex].values[pageData.selectedConditionKey] = newValue;
		if(e.key == 'Enter'){
			document.getElementById('wordSelectControl').classList.add('hidden');
		}
	}
	document.getElementById('wordData').innerText = JSON.stringify(conditionData[pageData.editWordIndex].values);
});

function changeinputStyle(value) {
	if (value < 0) {
		elemConditionValueInput.style.background = '#fc8';
	} else if(value > 0) {
		elemConditionValueInput.style.background = '#8fc';
	} else {
		elemConditionValueInput.style.background = 'inherit';
	}
}
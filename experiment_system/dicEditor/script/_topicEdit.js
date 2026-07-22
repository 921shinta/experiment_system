import { pageData, refreshWordSelect, topicData } from "./topic.js";

// すべてのinput要素にイベントリスナを振る
const elemsCheckbox = document.querySelectorAll('#keySelect input[type="checkbox"]');
elemsCheckbox.forEach(elem => {
	elem.addEventListener('change', () => {
		pageData.isEdited = true;
		// console.log(elem.id);
		// console.log(elem.checked);
		let key = elem.id.split('-')[1];
		// console.log(`${key} => ${elem.checked}`);
		topicData[pageData.editWordIndex].keys[key] = elem.checked;
		// console.log(topicData);
	})
});

// 単語選択コントロール・新規
const elemWordSelectControlAdd = document.getElementById('wordSelectControl-add');
elemWordSelectControlAdd.addEventListener('click', () => {
	pageData.isEdited = true;
	const newWordObject = {
		'name': 'new',
		'keys': new Object()
	};
	Object.keys(topicData[0].keys).forEach(key => {
		newWordObject.keys[key] = false;
	});
	topicData.splice(pageData.hoveredWordIndex + 1, 0, newWordObject);
	refreshWordSelect();
	showEditData(pageData.hoveredWordIndex + 1);
});

// 単語選択コントロール・削除
const elemWordSelectControlDelete = document.getElementById('wordSelectControl-delete');
elemWordSelectControlDelete.addEventListener('click', () => {
	pageData.isEdited = true;
	topicData.splice(pageData.hoveredWordIndex, 1);
	refreshWordSelect();
	document.getElementById('wordSelectControl').classList.add('hidden');
});

// 単語選択コントロール・移動
const elemWordSelectControlMoveTo = document.getElementById('wordSelectControl-moveTo');
elemWordSelectControlMoveTo.addEventListener('click', () => {
	pageData.isEdited = true;
	let floatData = topicData.splice(pageData.hoveredWordIndex, 1)[0];
	topicData.splice(document.getElementById('wordSelectControl-switchOrder').value - 1, 0, floatData);
	refreshWordSelect();
	document.getElementById('wordSelectControl').classList.add('hidden');
});

// 編集画面・名前変更
const elemWordKeynameField = document.getElementById('wordKeyName');
elemWordKeynameField.addEventListener('change', () => {
	pageData.isEdited = true;
	topicData[pageData.editWordIndex].name = elemWordKeynameField.value;
	refreshWordSelect();
});

// #MARK: データ切替
export function showEditData(editWordIndex) {
	document.getElementById('wordSelectControl').classList.add('hidden');
	pageData.editWordIndex = editWordIndex;
	const wordObject = topicData[editWordIndex];
	console.log(wordObject);
	let topicEntries = Object.entries(wordObject.keys);
	topicEntries.forEach(entry => {
		document.getElementById(`ks-${entry[0]}`).checked = entry[1];
	});
	document.getElementById('wordKeyName').value = wordObject.name;
}

// #MARK: 一括変更ボタン
const batchSwitchAffects = {
	"ks-H": ["GBH", "GFH", "GRH", "GSH"],
	"ks-S": ["GBS", "GFS", "GRS", "GSS"],
	"ks-L": ["GBL", "GFL", "GRL", "GSL"],
	"ks-A": ["GFA", "GSA"],
	"ks-T": ["GGT", "GFT"],
	"ks-R": ["GFR", "GRR"],
	"ks-Z": ["GFZ", "GRZ"],
	"ks-GB": ["GBH", "GBS", "GBL", "GGT"],
	"ks-GG": ["GCX", "GCY", "GGC", "GWL", "GWA", "GWS"],
	"ks-GF": ["GFH", "GFS", "GFL", "GFA", "GFT", "GFR", "GFZ"],
	"ks-GR": ["GRH", "GRS", "GRL", "GRR", "GRZ", "GRD", "GRC"],
	"ks-GS": ["GSH", "GSS", "GSL", "GSA", "GSW"]
};
Object.entries(batchSwitchAffects).forEach(entry => {
	document.getElementById(entry[0]).addEventListener('click', () => {
		pageData.isEdited = true;
		entry[1].forEach(topicKey => {
			document.getElementById(`ks-${topicKey}`).click();
		});
	});
});
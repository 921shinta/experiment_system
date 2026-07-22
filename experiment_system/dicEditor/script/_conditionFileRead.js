import { conditionData, startEdit, DEBUG } from "./condition.js";

const elemFileRead = document.getElementById('fileRead');

export function setFileReader() {
	elemFileRead.addEventListener('change', checkFile, false);
}

function checkFile() {
	const file = this.files[0];
	if(DEBUG.fileRead) console.log(file);
	if(file.name == 'conditionValues.json') {
		const reader = new FileReader();
		reader.readAsText(file);
	
		reader.onload = (e) => {
			buildKeysObject(e.target.result);
		};
	}
}

function buildKeysObject(fileContent) {
	const contentEntries = Object.entries(JSON.parse(fileContent));
	console.log(contentEntries);
	for(let i = 0; i < contentEntries.length; i++) {
		let name = contentEntries[i][0];
		let values = JSON.parse(JSON.stringify(contentEntries[i][1]));
		conditionData.push({"name": name, "values": values});
	}
	startEdit();
}
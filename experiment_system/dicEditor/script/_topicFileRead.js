import { DEBUG, pageData, startEdit, topicData } from "./topic.js";

const elemFileRead = document.getElementById('fileRead');

export function setFileReader() {
	elemFileRead.addEventListener('change', checkFile, false);
}

function checkFile() {
	const file = this.files[0];
	if(DEBUG.fileRead) console.log(file);
	if(file.name == 'keysFromTopic.csv') {		
		const reader = new FileReader();
		reader.readAsText(file);
	
		reader.onload = (e) => {
			buildKeysObject(e.target.result);
		};
	}
}

function buildKeysObject(fileContent) {
	const contentArray = fileContent.replaceAll(/\r/g, '').split('\n');
	// let topicData = new Object();
	let keys;

	for(let i = 1; i < contentArray.length; i++) {
		let topicInfo = contentArray[i].replaceAll(/\s/g, '').split(',');
		// console.log(subjectInfo);
		if (topicInfo[0] == 'c') {
			// コメント行なので無視
		} else if(topicInfo[0] == 'i') {
			topicInfo.splice(0, 2);
			keys = topicInfo;
			// // キーの順番を格納
			pageData._keys = keys;
		} else {
			topicInfo.shift();
			let name = topicInfo.shift();
			let topicKeys = new Object();
			for(let j = 0; j < topicInfo.length; j++) {
				if(topicInfo[j] == '1') {
					topicKeys[keys[j]] = true;
				} else {
					topicKeys[keys[j]] = false;
				}
			}
			topicData.push({"name": name, "keys": topicKeys});
		}
	}
	if(DEBUG.fileRead) console.log(topicData);
	startEdit();
}
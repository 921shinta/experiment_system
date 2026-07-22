import { pageData, conditionData } from "./condition.js";

export function enableConditionExportButton() {
	const elemExportFile = document.getElementById('exportFile');
	elemExportFile.removeAttribute('hidden');
	elemExportFile.addEventListener('click', () => {
		let exportObject = new Object();
		conditionData.forEach(condition => {
			exportObject[condition.name] = JSON.parse(JSON.stringify(condition.values));
		});
		const blob = new Blob([JSON.stringify(exportObject)], {type: "text/plain"});
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'conditionValues.json';
		a.click();
		URL.revokeObjectURL(url);
		pageData.unsavedTime = 0;
		pageData.isEdited = false;
		document.querySelector('.unsavedTime span').innerText = `00:00`;
	});	
}

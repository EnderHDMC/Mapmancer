// Function to handle keypress events
function handleKeyPress(e: KeyboardEvent) {
	if (e.code === 'F1') {
		e.preventDefault();
	}
	if (e.code === 'F2') {
		e.preventDefault();
	}
	if (e.code === 'F3') {
		e.preventDefault();
	}
}

// Attach the event listener to the document
document.addEventListener('keydown', handleKeyPress);

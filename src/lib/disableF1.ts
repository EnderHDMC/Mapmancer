// Function to handle keypress events
function handleKeyPress(e: KeyboardEvent) {
	// Check if the pressed key is F1 (key code 112)
	if (e.code === 'F1') {
		// Prevent the default behavior (opening Chrome Help page)
		e.preventDefault();
	}
}

// Attach the event listener to the document
document.addEventListener('keydown', handleKeyPress);

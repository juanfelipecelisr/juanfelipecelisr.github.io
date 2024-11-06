// Wait until the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function () {
    // Get all navigation links
    const navLinks = document.querySelectorAll("nav ul li a");

    // Function to show the selected section
    function showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll("main section").forEach(section => {
            section.style.display = "none";
        });

        // Display the selected section
        const sectionToShow = document.getElementById(sectionId);
        if (sectionToShow) {
            sectionToShow.style.display = "block";
        }
    }

    // Add click event listeners to each navigation link
    navLinks.forEach(link => {
        link.addEventListener("click", function (event) {
            event.preventDefault(); // Prevent default link behavior

            // Get the target section from data attribute
            const sectionId = this.getAttribute("data-section");
            showSection(sectionId);
        });
    });

    // Initial setup to show the first section on page load
    showSection("about");
});

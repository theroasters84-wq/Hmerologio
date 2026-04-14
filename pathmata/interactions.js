let calendarData = [];

// Ακούμε το event 'routeLoaded' (που καλείται από τον router στο index.html)
document.addEventListener('routeLoaded', async () => {
    const gridContainer = document.getElementById('calendar-grid');
    
    // Αν έχει φορτωθεί η σελίδα του ημερολογίου
    if (gridContainer) {
        await ensureModalsLoaded();
        await loadAndRenderCalendar();
    }
});

// Φόρτωση των HTML δομών (modals) δυναμικά, αν δεν υπάρχουν ήδη στο DOM
async function ensureModalsLoaded() {
    if (!document.getElementById('recipes-modal')) {
        try {
            const recipesRes = await fetch('protaseis_fagiton/recipes_modal.html');
            const recipesHtml = await recipesRes.text();
            
            const infoRes = await fetch('plirofories_eorton/info_modal.html');
            const infoHtml = await infoRes.text();
            
            const container = document.createElement('div');
            container.id = 'modals-container';
            container.innerHTML = recipesHtml + infoHtml;
            document.body.appendChild(container);
        } catch (e) {
            console.error('Σφάλμα κατά τη φόρτωση των modals:', e);
        }
    }
}

// Λήψη δεδομένων JSON και δυναμικό rendering του Ημερολογίου
async function loadAndRenderCalendar() {
    try {
        const response = await fetch('dedomena/calendar_data.json');
        calendarData = await response.json();
        
        const gridContainer = document.getElementById('calendar-grid');
        gridContainer.innerHTML = ''; // Καθαρισμός grid

        const fragment = document.createDocumentFragment(); // Χρήση fragment για βελτιστοποίηση απόδοσης με μεγάλο JSON

        let currentMonthYear = '';

        calendarData.forEach((day, index) => {
            const dateObj = new Date(day.date);
            const monthYearStr = dateObj.toLocaleDateString('el-GR', { month: 'long', year: 'numeric' });
            
            if (monthYearStr !== currentMonthYear) {
                const header = document.createElement('h2');
                header.className = 'month-header';
                header.style.gridColumn = '1 / -1'; // Εξασφαλίζει ότι ο τίτλος πιάνει όλες τις στήλες
                header.style.textAlign = 'center';
                header.textContent = monthYearStr.charAt(0).toUpperCase() + monthYearStr.slice(1);
                fragment.appendChild(header);
                currentMonthYear = monthYearStr;
            }

            const card = document.createElement('article');
            card.id = `day-${day.date}`;
            card.className = `day-card color-${day.fasting_type_color}`;
            card.style.cursor = 'pointer'; // Οπτική ένδειξη αλληλεπίδρασης
            
            // Interaction 1: Κλικ σε ολόκληρη την κάρτα ανοίγει το Recipes Modal
            card.onclick = () => openRecipesModal(index);
            
            const dateStr = dateObj.toLocaleDateString('el-GR', { weekday: 'long', day: 'numeric', month: 'long' });

            // Interaction 2: Το κουμπί 'i' έχει onclick event με stopPropagation() (που γίνεται μέσα στη συνάρτηση)
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div class="date-header">${dateStr}</div>
                    <button onclick="openInfoModal(event, ${index})" aria-label="Πληροφορίες" style="background: #e9ecef; border: none; border-radius: 50%; width: 26px; height: 26px; font-weight: bold; cursor: pointer; color: #555; display: flex; align-items: center; justify-content: center; font-family: serif;">i</button>
                </div>
                <div class="feast-name">${day.feast_name}</div>
                <div class="fasting-label">${day.fasting_label}</div>
            `;
            
            fragment.appendChild(card);
        });
        
        gridContainer.appendChild(fragment); // Προσθήκη όλων των 365 ημερών ταυτόχρονα στο DOM

        // Auto-Scroll στη σημερινή μέρα
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;
        
        const todayCard = document.getElementById(`day-${todayStr}`);
        if (todayCard) {
            todayCard.classList.add('today-highlight');
            setTimeout(() => {
                todayCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100); // Μικρή καθυστέρηση για να βεβαιωθούμε ότι το DOM έχει ενημερωθεί
        }
    } catch (error) {
        console.error('Αποτυχία φόρτωσης δεδομένων ημερολογίου:', error);
        document.getElementById('calendar-grid').innerHTML = '<p>Αδυναμία φόρτωσης δεδομένων.</p>';
    }
}

// Λογική Modals
window.openRecipesModal = function(index) {
    const day = calendarData[index];
    document.getElementById('recipe-fasting-status').textContent = 'Κανόνας: ' + day.fasting_label;
    
    const listContainer = document.getElementById('recipe-list-container');
    listContainer.innerHTML = '';
    
    if (day.recipes && day.recipes.length > 0) {
        day.recipes.forEach(recipe => {
            const li = document.createElement('li');
            li.textContent = recipe.name;
            listContainer.appendChild(li);
        });
    } else {
        listContainer.innerHTML = '<li>Δεν υπάρχουν διαθέσιμες προτάσεις για αυτή την ημέρα.</li>';
    }
    
    document.getElementById('recipes-modal').style.display = 'flex';
};

window.openInfoModal = function(event, index) {
    // Αποτρέπει το "bubbling" του click, ώστε να μην ανοίξει και το modal των συνταγών
    event.stopPropagation(); 
    
    const day = calendarData[index];
    document.getElementById('feast-title').textContent = day.feast_name;
    
    const description = day.feast_description || '';
    document.getElementById('feast-description').innerHTML = description ? `<p>${description}</p>` : '';
    
    document.getElementById('info-modal').style.display = 'flex';
};

// Κλείσιμο modal (χρησιμοποιείται και όταν πατάμε στο background ή στο X)
window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
};

// --- Λογική Εγκατάστασης PWA (Install Button) ---
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // Αποτροπή της προεπιλεγμένης συμπεριφοράς (αυτόματη εμφάνιση banner)
    e.preventDefault();
    // Αποθήκευση του event για να το καλέσουμε όταν ο χρήστης πατήσει το κουμπί
    deferredPrompt = e;
    
    const installBtn = document.getElementById('install-btn');
    if (installBtn) {
        // Εμφάνιση του κουμπιού εφόσον η συσκευή υποστηρίζει εγκατάσταση
        installBtn.style.display = 'block';
        
        // Προσθήκη event listener για το κλικ στο κουμπί
        installBtn.addEventListener('click', async () => {
            // Κρύβουμε το κουμπί αμέσως μόλις πατηθεί
            installBtn.style.display = 'none';
            
            // Εμφάνιση του διαλόγου εγκατάστασης της συσκευής/browser
            deferredPrompt.prompt();
            
            // Αναμονή για την επιλογή του χρήστη (αποδοχή ή απόρριψη)
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`Η επιλογή του χρήστη για εγκατάσταση ήταν: ${outcome}`);
            
            // Το event μπορεί να χρησιμοποιηθεί μόνο μία φορά, οπότε το καθαρίζουμε
            deferredPrompt = null;
        });
    }
});

window.addEventListener('appinstalled', () => {
    // Όταν η εφαρμογή εγκατασταθεί, βεβαιωνόμαστε ότι το κουμπί είναι κρυμμένο
    const installBtn = document.getElementById('install-btn');
    if (installBtn) {
        installBtn.style.display = 'none';
    }
    console.log('Η εφαρμογή Eutrophia εγκαταστάθηκε επιτυχώς!');
    deferredPrompt = null;
});
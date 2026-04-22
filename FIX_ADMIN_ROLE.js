/* 
 * Rýchla oprava admin role v browser console
 * Otvorte Developer Tools (F12) a zadajte do Console:
 */

// 1. Zobraziť aktuálneho používateľa
console.log('Current user:', JSON.parse(localStorage.getItem('currentUser')));

// 2. Nastaviť admin rolu
const user = JSON.parse(localStorage.getItem('currentUser'));
user.role = 'admin';
localStorage.setItem('currentUser', JSON.stringify(user));
console.log('Updated user:', user);

// 3. Obnoviť stránku
location.reload();

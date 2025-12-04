/* global.js
   Central client-side "backend" using localStorage.
   Save this as global.js and include in every page before page-specific scripts.
*/

(() => {
  // Users (array) and bookings (array) in localStorage
  window.users = JSON.parse(localStorage.getItem("cep_users") || "[]");
  window.bookings = JSON.parse(localStorage.getItem("cep_bookings") || "[]");
  window.currentUser = JSON.parse(localStorage.getItem("cep_currentUser") || "null");

  // Utility: persist
  function saveUsers(){ localStorage.setItem("cep_users", JSON.stringify(window.users)); }
  function saveBookings(){ localStorage.setItem("cep_bookings", JSON.stringify(window.bookings)); }
  function saveCurrent(){ localStorage.setItem("cep_currentUser", JSON.stringify(window.currentUser)); }

  // Expose to window
  window._cep = {
    signup,
    login,
    logout,
    requireLogin,
    saveBooking,
    loadBookingsForAdmin,
    acceptBooking,
    rejectBooking,
    deleteBooking,
    getCurrentUser,
    ensureNavbar
  };

  function getCurrentUser(){ return window.currentUser; }

  // Signup: expects object { firstname, lastname, email, dob, password }
  function signup(payload){
    payload.email = (payload.email || "").toLowerCase().trim();
    if(!payload.email || !payload.password || !payload.firstname){
      alert("Please fill required fields.");
      return false;
    }
    // prevent duplicate email
    if(window.users.find(u => u.email === payload.email)){
      alert("Account with this email already exists.");
      return false;
    }
    payload.role = "user";
    window.users.push(payload);
    saveUsers();
    alert("Signup successful. Please sign in.");
    window.location.href = "signin.html";
    return true;
  }

  // Login: accepts email/username and password
  function login(email, password){
    email = (email || "").toLowerCase().trim();
    // admin shortcut
    if(email === "admin@gmail.com" && password === "admin123"){
      window.currentUser = { email: "admin@gmail.com", role: "admin", firstname: "Admin" };
      saveCurrent();
      window.location.href = "admin.html";
      return true;
    }
    const user = window.users.find(u => u.email === email && u.password === password);
    if(!user){
      alert("Invalid credentials.");
      return false;
    }
    window.currentUser = user;
    saveCurrent();
    alert("Login successful.");
    // redirect to home or intended page
    window.location.href = "index.html";
    return true;
  }

  function logout(){
    window.currentUser = null;
    saveCurrent();
    window.location.href = "signin.html";
  }

  // On pages that require login call requireLogin() at top
  function requireLogin(){
    if(!window.currentUser){
      alert("You must sign in to continue.");
      window.location.href = "signin.html";
      return false;
    }
    return true;
  }

  // Generic saveBooking(bookingObject)
  // bookingObject must include eventType and other fields
  function saveBooking(bookingObj){
    bookingObj.id = Date.now() + Math.floor(Math.random()*999);
    bookingObj.timestamp = new Date().toISOString();
    bookingObj.status = "Pending";
    bookingObj.userEmail = window.currentUser ? window.currentUser.email : "guest";
    window.bookings.push(bookingObj);
    saveBookings();
    alert("Booking saved and sent to admin. Thank you!");
  }

  // Admin functions
  function loadBookingsForAdmin() {
    // returns copy
    return (window.bookings || []).slice().reverse();
  }

  function acceptBooking(id){
    window.bookings = window.bookings.map(b => b.id === id ? {...b, status: "Accepted"} : b);
    saveBookings();
  }
  function rejectBooking(id){
    window.bookings = window.bookings.map(b => b.id === id ? {...b, status: "Rejected"} : b);
    saveBookings();
  }
  function deleteBooking(id){
    if(!confirm("Delete this booking?")) return;
    window.bookings = window.bookings.filter(b => b.id !== id);
    saveBookings();
  }

  // Navbar helper: call ensureNavbar() on top of body to inject simple nav and update signin state
  function ensureNavbar(){
    // if page already has #cepNavbar skip
    if(document.getElementById("cepNavbar")) return;
    const nav = document.createElement("nav");
    nav.id = "cepNavbar";
    nav.style.cssText = "background:#A73121;color:#fff;padding:10px 16px;border-radius:8px;margin:12px 8px;display:flex;align-items:center;justify-content:space-between;";
    nav.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px">
        <img src="assets/logo.png" alt="logo" style="height:40px;border-radius:50%;object-fit:cover">
        <a href="index.html" style="color:#fff;text-decoration:none;font-weight:700">City Event Planner</a>
      </div>
      <div id="cepNavRight" style="display:flex;gap:12px;align-items:center"></div>
    `;
    document.body.insertBefore(nav, document.body.firstChild);
    updateNavRight();
  }

  function updateNavRight(){
    const el = document.getElementById("cepNavRight");
    if(!el) return;
    const user = window.currentUser;
    el.innerHTML = "";
    const links = [
      {text:"Home", href:"index.html"},
      {text:"Services", href:"our_services.html"},
      {text:"About", href:"about.html"},
      {text:"Contact", href:"contact.html"}
    ];
    links.forEach(l=>{
      const a = document.createElement("a");
      a.href = l.href; a.innerText = l.text;
      a.style.color = "#fff"; a.style.textDecoration = "none"; a.style.margin = "0 6px";
      el.appendChild(a);
    });

    if(user && user.role === "admin"){
      const a = document.createElement("a");
      a.href = "admin.html"; a.innerText = "Admin"; a.style.color="#fff"; a.style.fontWeight="700";
      el.appendChild(a);
      const btn = document.createElement("button");
      btn.innerText = "Logout"; btn.onclick = logout;
      styleSmallBtn(btn);
      el.appendChild(btn);
      return;
    }

    if(user){
      const span = document.createElement("span");
      span.innerText = user.firstname ? `Hi, ${user.firstname}` : user.email;
      span.style.marginRight = "6px"; span.style.fontWeight = "600"; span.style.color = "#fff";
      el.appendChild(span);
      const btn = document.createElement("button");
      btn.innerText = "Logout"; btn.onclick = logout;
      styleSmallBtn(btn);
      el.appendChild(btn);
    } else {
      const a1 = document.createElement("a");
      a1.href = "signin.html"; a1.innerText = "Sign in"; a1.style.color="#fff"; a1.style.fontWeight="600";
      el.appendChild(a1);
      const a2 = document.createElement("a");
      a2.href = "signup.html"; a2.innerText = "Sign up"; a2.style.color="#fff"; a2.style.marginLeft="8px";
      el.appendChild(a2);
    }
  }

  function styleSmallBtn(b){
    b.style.cssText = "background:transparent;border:1px solid #fff;color:#fff;padding:6px 8px;border-radius:8px;cursor:pointer;font-weight:600;margin-left:8px";
  }

  // Expose admin funcs to window
  window.acceptBooking = (id) => { acceptBooking(id); window.location.reload(); };
  window.rejectBooking = (id) => { rejectBooking(id); window.location.reload(); };
  window.deleteBooking = (id) => { deleteBooking(id); window.location.reload(); };

  // make functions available on _cep object
  window.addEventListener("DOMContentLoaded", () => {
    // refresh global vars from storage (in case updated)
    window.users = JSON.parse(localStorage.getItem("cep_users") || "[]");
    window.bookings = JSON.parse(localStorage.getItem("cep_bookings") || "[]");
    window.currentUser = JSON.parse(localStorage.getItem("cep_currentUser") || "null");
    // update nav when DOM ready if present
    updateNavRight();
  });

  // Expose small helpers on window for convenience
  window.requireLogin = requireLogin;
  window.saveBooking = saveBooking;
  window.getCurrentUser = getCurrentUser;
  window.ensureNavbar = ensureNavbar;

})();
// ===================== ACCEPT BOOKING =====================
function acceptBooking(id){
    let bookings = JSON.parse(localStorage.getItem("cep_bookings") || "[]");
    bookings = bookings.map(b => {
        if(b.id === id){
            b.status = "accepted";
        }
        return b;
    });
    localStorage.setItem("cep_bookings", JSON.stringify(bookings));
    alert("Booking Accepted ✔");
    location.reload();
}



// ===================== REJECT BOOKING =====================
function rejectBooking(id){
    let bookings = JSON.parse(localStorage.getItem("cep_bookings") || "[]");
    bookings = bookings.map(b => {
        if(b.id === id){
            b.status = "rejected";
        }
        return b;
    });
    localStorage.setItem("cep_bookings", JSON.stringify(bookings));
    alert("Booking Rejected ❌");
    location.reload();
}



// ===================== DELETE BOOKING =====================
function deleteBooking(id){
    let bookings = JSON.parse(localStorage.getItem("cep_bookings") || "[]");
    bookings = bookings.filter(b => b.id !== id);
    localStorage.setItem("cep_bookings", JSON.stringify(bookings));
    alert("Booking Deleted 🗑");
    location.reload();
}


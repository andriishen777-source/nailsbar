// ==========================================
// 1. АНІМАЦІЇ ТА СПОСТЕРІГАЧІ
// ==========================================
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
        }
    });
});
document.querySelectorAll('.hidden').forEach((el) => observer.observe(el));

// ==========================================
// 2. УНІВЕРСАЛЬНЕ ЗАКРИТТЯ ВІКОН
// ==========================================
document.querySelectorAll(".close-btn, .close-calendar-btn, .close-check-btn, .close-cabinet-btn, .close-reviews-btn, .close-cert-btn").forEach(btn => {
    btn.addEventListener("click", function() {
        const parentModal = this.closest(".modal");
        if (parentModal) parentModal.style.display = "none";
    });
});

// Закриття по кліку на темний фон
window.addEventListener("click", (event) => {
    if (event.target.classList && event.target.classList.contains("modal")) {
        event.target.style.display = "none";
    }
});

// ==========================================
// 3. ВІДКРИТТЯ ФОРМИ ЗАПИСУ (ФІКС КНОПОК)
// ==========================================
const bookingModal = document.getElementById("bookingModal");
// Шукаємо ТІЛЬКИ правильні кнопки: остання в меню, на головному екрані, та в модалці перевірки
const openBtns = document.querySelectorAll(".navbar .nav-btn:last-child, .hero .cta-btn, #goToBookingBtn, #goToBookingBtnFromCheck, #goToBookingBtnFromCheck2");

openBtns.forEach(btn => {
    if(btn) {
        btn.addEventListener("click", () => {
            // Якщо відкрита перевірка запису - ховаємо її
            const checkModal = document.getElementById("checkBookingModal");
            if (checkModal) checkModal.style.display = "none";
            
            if (bookingModal) bookingModal.style.display = "flex";
        });
    }
});

// ==========================================
// 4. ІНІЦІАЛІЗАЦІЯ SUPABASE
// ==========================================
const supabaseUrl = 'https://bgmrbujrxdyhdnmgcevx.supabase.co'; 
const supabaseKey = 'sb_publishable_t7QyH8dHNBBbFQGY_62oRA_CaA5vXa_'; 
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// ==========================================
// 5. ВІДПРАВКА ЗАПИСУ ТА ТЕЛЕГРАМ
// ==========================================
const bookingForm = document.getElementById("bookingForm");
if (bookingForm) {
    bookingForm.addEventListener("submit", async function(e) {
        e.preventDefault(); 
        
        const name = document.getElementById("clientName").value.trim();
        const phone = document.getElementById("clientPhone").value.trim();
        const dateTime = document.getElementById("selectedDateTime").value;
        const comment = document.getElementById("clientComment").value.trim();
        
        const selectedServices = [];
        document.querySelectorAll('.modal-service-cb:checked').forEach(cb => selectedServices.push(cb.value));

        if (selectedServices.length === 0) return alert("Будь ласка, оберіть хоча б одну послугу!");
        if (!dateTime) return alert("Будь ласка, оберіть дату та час!");

        const submitBtn = document.querySelector("#bookingForm .submit-btn");
        const originalText = submitBtn.innerText;
        submitBtn.innerText = "Відправляємо... ⏳";
        submitBtn.disabled = true;

        const { data, error } = await supabaseClient.from('bookings').insert([{ 
            client_name: name, 
            client_phone: phone, 
            services: selectedServices.join(' | '),
            booking_date: dateTime,
            comment: comment
        }]);

        submitBtn.innerText = originalText;
        submitBtn.disabled = false;

        if (error) {
            console.error("Помилка Supabase:", error);
            alert("Ой, сталась помилка при записі 😔 Спробуйте ще раз.");
        } else {
            alert("✅ Ваш запис успішно підтверджено! Чекаємо на вас.");
            
            // Телеграм Бот
            const botToken = '8826664279:AAGvZX59mOnuw1hKwa5tUtEZ2xkUWn1DFC4';
            const chatId = '1366887003';
            const tgMessage = `🔥 *НОВИЙ ЗАПИС!*\n\n👤 *Клієнт:* ${name}\n📞 *Телефон:* ${phone}\n📅 *Дата та час:* ${dateTime}\n💅 *Послуги:* ${selectedServices.join(', ')}\n💬 *Коментар:* ${comment || 'Немає'}`;
            
            try {
                fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: chatId, text: tgMessage, parse_mode: 'Markdown' })
                });
            } catch (err) { console.log("Помилка відправки в ТГ", err); }
            
            if(bookingModal) bookingModal.style.display = "none";
            bookingForm.reset();
            const calendarBtn = document.getElementById("openCalendarBtn");
            if (calendarBtn) {
                calendarBtn.innerText = "📅 Оберіть дату та час";
                calendarBtn.style.color = "#aaa";
            }
            document.getElementById("selectedDateTime").value = "";
        }
    });
}

// ==========================================
// 6. КАЛЕНДАР (ЛОГІКА ТА ГЕНЕРАЦІЯ ДНІВ)
// ==========================================
const calendarModal = document.getElementById("calendarModal");
const openCalendarBtn = document.getElementById("openCalendarBtn");
const calendarDays = document.getElementById("calendarDays");
const timeSlotsTitle = document.getElementById("timeSlotsTitle");
const timeSlots = document.getElementById("timeSlots");
const selectedDateTimeInput = document.getElementById("selectedDateTime");
const toast = document.getElementById("toast");

let selectedDate = null;
let navDate = new Date(); 

if (openCalendarBtn && calendarModal) {
    openCalendarBtn.addEventListener("click", () => {
        calendarModal.style.display = "flex";
        generateDays(); 
    });
}

const prevMonthBtn = document.getElementById("prevMonthBtn");
const nextMonthBtn = document.getElementById("nextMonthBtn");

function generateDays() {
    if (!calendarDays) return;
    calendarDays.innerHTML = "";
    
    // --- 1. ДОДАЄМО НАЗВИ ДНІВ ТИЖНЯ НАД ЦИФРАМИ ---
    const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
    weekdays.forEach(day => {
        let label = document.createElement("div");
        label.innerText = day;
        label.style.fontWeight = "bold";
        label.style.color = "#E1306C"; // Рожевий акцентний колір
        label.style.fontSize = "0.85rem";
        label.style.textAlign = "center";
        label.style.paddingBottom = "10px";
        calendarDays.appendChild(label);
    });

    if(timeSlots) timeSlots.style.display = "none";
    if(timeSlotsTitle) timeSlotsTitle.style.display = "none";
    
    const today = new Date();
    const year = navDate.getFullYear();
    const monthIndex = navDate.getMonth(); 
    const monthNames = ["Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень", "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"];
    
    if(document.getElementById("currentMonthYear")) {
        document.getElementById("currentMonthYear").innerText = `${monthNames[monthIndex]} ${year}`;
    }

    const isCurrentMonth = (year === today.getFullYear() && monthIndex === today.getMonth());
    
    if (prevMonthBtn) {
        if (isCurrentMonth) prevMonthBtn.classList.add("disabled");
        else prevMonthBtn.classList.remove("disabled");
    }

    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    
    // --- 2. ВИРАХОВУЄМО ПУСТІ КЛІТИНКИ ЗЛІВА ---
    let firstDayOfMonth = new Date(year, monthIndex, 1).getDay();
    // В JavaScript Неділя - це 0. Нам треба змістити, щоб Понеділок був першим.
    let emptyDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    // Малюємо невидимі пусті клітинки до 1-го числа
    for (let j = 0; j < emptyDays; j++) {
        let emptyDiv = document.createElement("div");
        emptyDiv.style.visibility = "hidden"; 
        calendarDays.appendChild(emptyDiv);
    }

    let realVacations = JSON.parse(localStorage.getItem("adminVacations")) || [];

    // --- 3. МАЛЮЄМО САМІ ДНІ ---
    for (let i = 1; i <= daysInMonth; i++) {
        let dayBtn = document.createElement("div");
        dayBtn.classList.add("day-box");
        dayBtn.innerText = i;
        
        let loopDateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        
        if (isCurrentMonth && i < today.getDate()) {
            dayBtn.classList.add("disabled");
        } else if (realVacations.includes(loopDateStr)) {
            dayBtn.classList.add("disabled");
            dayBtn.addEventListener("click", () => showToast("Цей день є вихідним! 🌴"));
        } else {
            dayBtn.addEventListener("click", () => {
                document.querySelectorAll(".day-box").forEach(el => el.classList.remove("selected"));
                dayBtn.classList.add("selected");
                
                let formattedMonth = monthNames[monthIndex].toLowerCase();
                if (formattedMonth.endsWith('ь')) formattedMonth = formattedMonth.slice(0, -1) + 'я';
                
                selectedDate = `${i} ${formattedMonth}`; 
                showTimeSlots(i); 
            });
        }
        calendarDays.appendChild(dayBtn);
    }
}

if(prevMonthBtn && nextMonthBtn) {
    prevMonthBtn.addEventListener("click", () => {
        if (!prevMonthBtn.classList.contains("disabled")) {
            navDate.setMonth(navDate.getMonth() - 1);
            generateDays();
        }
    });
    nextMonthBtn.addEventListener("click", () => {
        navDate.setMonth(navDate.getMonth() + 1);
        generateDays();
    });
}

async function showTimeSlots(dayNumber) {
    if (!timeSlots) return;
    timeSlots.innerHTML = "Завантаження годин... ⏳";
    timeSlotsTitle.style.display = "block";
    timeSlots.style.display = "grid";

    const year = navDate.getFullYear();
    const monthIndex = navDate.getMonth();
    const dateObj = new Date(year, monthIndex, dayNumber);
    const dayOfWeek = dateObj.getDay(); 

    const dateString = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;

    let availableHours = [];
    let freshSpecificSchedule = JSON.parse(localStorage.getItem("adminSpecificSchedule")) || {};
    let freshWeeklySchedule = JSON.parse(localStorage.getItem("adminWeeklySchedule")) || {
        1: ["10:00", "12:00", "14:00", "16:00"], 2: ["10:00", "12:00", "14:00", "16:00"],
        3: ["10:00", "12:00", "14:00", "16:00"], 4: ["10:00", "12:00", "14:00", "16:00"],
        5: ["10:00", "12:00", "14:00", "16:00"], 6: ["11:00", "13:00", "15:00"], 0: []
    };

    if (freshSpecificSchedule[dateString] && freshSpecificSchedule[dateString].length > 0) {
        availableHours = freshSpecificSchedule[dateString];
    } else {
        availableHours = freshWeeklySchedule[dayOfWeek] || [];
    }

    if (availableHours.length === 0) {
        timeSlots.innerHTML = "<p style='grid-column: span 3; text-align: center; color: #888;'>У цей день немає прийомів</p>";
        return;
    }

    const { data: bookings } = await supabaseClient
        .from('bookings')
        .select('booking_date')
        .like('booking_date', `${selectedDate}%`); 

    const bookedTimes = bookings ? bookings.map(b => b.booking_date.split(', ')[1]) : [];
    timeSlots.innerHTML = "";

    availableHours.forEach(time => {
        let timeBtn = document.createElement("div");
        timeBtn.classList.add("time-box");
        timeBtn.innerText = time;

        if (bookedTimes.includes(time)) {
            timeBtn.classList.add("booked");
            timeBtn.addEventListener("click", () => showToast("Цей час вже заброньовано! 💖"));
        } else {
            timeBtn.classList.add("available");
            timeBtn.addEventListener("click", () => {
                let finalSelection = `${selectedDate}, ${time}`;
                openCalendarBtn.innerText = `📅 ${finalSelection}`;
                openCalendarBtn.style.color = "white";
                selectedDateTimeInput.value = finalSelection; 
                calendarModal.style.display = "none";
            });
        }
        timeSlots.appendChild(timeBtn);
    });
}

function showToast(message) {
    if (!toast) return;
    toast.innerText = message || "Цей час вже заброньовано! 💖";
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
}

// ==========================================
// 7. ДИНАМІЧНИЙ ПРАЙС-ЛИСТ (КЛІЄНТ ТА АДМІН)
// ==========================================
const mainPriceList = document.getElementById("mainPriceList");
const bookingServicesList = document.getElementById("bookingServicesList");
const adminPriceTableBody = document.getElementById("adminPriceTableBody");
const editPriceBtnHero = document.getElementById("editPriceBtnHero");

// Базові послуги (якщо адмін ще нічого не міняв)
const defaultServices = [
    { id: 1, name: "Комплекс (Зняття + Манікюр + Покриття)", price: 650 },
    { id: 2, name: "Зняття + Покриття", price: 650 },
    { id: 3, name: "Манікюр + Покриття", price: 620 },
    { id: 4, name: "Зняття + Манікюр", price: 550 },
    { id: 5, name: "Однотонне покриття", price: 450 }
];

// Витягуємо прайс з пам'яті
let activeServices = JSON.parse(localStorage.getItem("adminPriceList")) || defaultServices;

// Функція малювання прайсу для клієнтів (на головній та в модалці)
function renderClientPriceList() {
    if (mainPriceList) mainPriceList.innerHTML = "";
    if (bookingServicesList) bookingServicesList.innerHTML = "";

    activeServices.forEach((service, index) => {
        // 1. Додаємо на головну сторінку
        if (mainPriceList) {
            let item = document.createElement("div");
            item.className = "price-item hidden";
            item.style.transitionDelay = `${index * 0.1}s`;
            item.innerHTML = `
                <div class="price-name">${service.name}</div>
                <div class="price-value">${service.price} ₴</div>
            `;
            
            // Логіка кліку по послузі (відкриває форму з галочкою)
            item.addEventListener("click", () => {
                const bookingModal = document.getElementById("bookingModal");
                if (bookingModal) bookingModal.style.display = "flex";
                
                // Ставимо галочку
                document.querySelectorAll(".modal-service-cb").forEach(cb => {
                    cb.checked = (cb.value === service.name);
                });
            });
            mainPriceList.appendChild(item);
            
            // Підключаємо анімацію появи
            observer.observe(item);
        }

        // 2. Додаємо в форму запису (чекбокси)
        if (bookingServicesList) {
            bookingServicesList.innerHTML += `
                <label class="custom-checkbox">
                    <input type="checkbox" value="${service.name}" class="modal-service-cb"> 
                    <span>${service.name} - ${service.price} ₴</span>
                </label>
            `;
        }
    });
}

// Запускаємо малювання при завантаженні сайту
renderClientPriceList();

// Відкриття кабінету по кнопці "Редагувати" на головній
if (editPriceBtnHero) {
    editPriceBtnHero.addEventListener("click", () => {
        const adminCabinetModal = document.getElementById("adminCabinetModal");
        if(adminCabinetModal) adminCabinetModal.style.display = "flex";
        switchCabinetView('priceEditingView');
    });
}

// --- ЛОГІКА РЕДАГУВАННЯ В КАБІНЕТІ ---
function renderAdminPriceList() {
    if (!adminPriceTableBody) return;
    adminPriceTableBody.innerHTML = "";
    
    if (activeServices.length === 0) {
        adminPriceTableBody.innerHTML = "<tr><td colspan='3' style='text-align:center;'>Список порожній</td></tr>";
        return;
    }

    activeServices.forEach(service => {
        let tr = document.createElement("tr");
        tr.innerHTML = `
            <td style="text-align: left;">${service.name}</td>
            <td>${service.price} ₴</td>
            <td><button class="delete-booking-btn" onclick="deleteService(${service.id})" title="Видалити послугу">❌</button></td>
        `;
        adminPriceTableBody.appendChild(tr);
    });
}

// Додавання нової послуги
const addNewServiceBtn = document.getElementById("addNewServiceBtn");
if (addNewServiceBtn) {
    addNewServiceBtn.addEventListener("click", () => {
        const nameInput = document.getElementById("newServiceName");
        const priceInput = document.getElementById("newServicePrice");
        
        const name = nameInput.value.trim();
        const price = parseInt(priceInput.value);

        if (!name || isNaN(price)) return alert("Будь ласка, введіть коректну назву та ціну!");

        const newId = activeServices.length > 0 ? Math.max(...activeServices.map(s => s.id)) + 1 : 1;
        
        activeServices.push({ id: newId, name: name, price: price });
        localStorage.setItem("adminPriceList", JSON.stringify(activeServices));
        
        nameInput.value = "";
        priceInput.value = "";
        
        renderAdminPriceList(); // Оновлюємо таблицю адміна
        renderClientPriceList(); // ОДРАЗУ оновлюємо прайс клієнта на сайті
    });
}

// Видалення послуги
window.deleteService = function(id) {
    if (confirm("Ви дійсно хочете видалити цю послугу з прайсу?")) {
        activeServices = activeServices.filter(s => s.id !== id);
        localStorage.setItem("adminPriceList", JSON.stringify(activeServices));
        renderAdminPriceList();
        renderClientPriceList();
    }
};

// ==========================================
// 8. ПЕРЕВІРКА ЗАПИСУ (КЛІЄНТИ)
// ==========================================
const checkBookingModal = document.getElementById("checkBookingModal");
const openCheckModalBtn = document.getElementById("openCheckModalBtn");
const verifyPhoneBtn = document.getElementById("verifyPhoneBtn");
const checkPhoneInput = document.getElementById("checkPhoneInput");
const checkPhoneSection = document.getElementById("checkPhoneSection");
const adminLoginSection = document.getElementById("adminLoginSection");
const checkResultSection = document.getElementById("checkResultSection");

if (openCheckModalBtn) {
    openCheckModalBtn.addEventListener("click", () => {
        if(checkPhoneSection) checkPhoneSection.style.display = "block";
        if(adminLoginSection) adminLoginSection.style.display = "none";
        if(checkResultSection) checkResultSection.style.display = "none";
        if(checkPhoneInput) checkPhoneInput.value = "";
        if(checkBookingModal) checkBookingModal.style.display = "flex";
    });
}

if (verifyPhoneBtn) {
    verifyPhoneBtn.addEventListener("click", async () => {
        const phone = checkPhoneInput.value.replace(/\D/g, ''); 
        if (!phone) return alert("Будь ласка, введіть номер телефону!");
        
        if(checkPhoneSection) checkPhoneSection.style.display = "none"; 

        if (phone === "0680011001") {
            if(adminLoginSection) adminLoginSection.style.display = "block"; 
            return;
        }

        verifyPhoneBtn.innerText = "Шукаємо... ⏳";
        const { data: userBookings, error } = await supabaseClient
            .from('bookings')
            .select('*')
            .eq('client_phone', phone)
            .order('created_at', { ascending: false }); 
        verifyPhoneBtn.innerText = "Знайти запис";

        if (error) {
            console.error("Помилка пошуку:", error);
            alert("Ой, сталась помилка при пошуку бази 😔");
            if(checkPhoneSection) checkPhoneSection.style.display = "block";
            return;
        }

        if(checkResultSection) {
            checkResultSection.innerHTML = ""; 
            if (userBookings && userBookings.length > 0) {
                let html = `<h3 style="color: var(--accent-pink); margin-bottom: 15px;">Ваші записи:</h3>`;
                userBookings.forEach(b => {
                    html += `
                        <div style="background: #1a1a1a; padding: 15px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #333; text-align: left;">
                            <p style="color: white; margin-bottom: 5px;"><strong>📅 Дата:</strong> ${b.booking_date}</p>
                            <p style="color: #aaa; font-size: 0.9rem; margin-bottom: 5px;"><strong>💅 Послуги:</strong> ${b.services}</p>
                            <p style="color: #888; font-size: 0.85rem;"><strong>Статус:</strong> Підтверджено ✅</p>
                        </div>
                    `;
                });
                html += `<button class="cta-btn" onclick="document.getElementById('checkBookingModal').style.display='none'" style="margin-top: 15px; width: 100%;">Добре, дякую</button>`;
                checkResultSection.innerHTML = html;
            } else {
                checkResultSection.innerHTML = `
                    <h3 style="color: white; margin-bottom: 15px;">Записів не знайдено 😔</h3>
                    <p style="color: #888; margin-bottom: 20px;">За номером ${phone} немає активних записів.</p>
                    <button class="cta-btn" id="goToBookingBtnFromCheck2" style="width: 100%;">Записатися зараз</button>
                `;
                document.getElementById("goToBookingBtnFromCheck2").addEventListener("click", () => {
                    checkBookingModal.style.display = "none";
                    if(bookingModal) bookingModal.style.display = "flex";
                });
            }
            checkResultSection.style.display = "block";
        }
    });
}

// ==========================================
// 9. АДМІН-ПАНЕЛЬ (ВХІД ТА КАБІНЕТ)
// ==========================================
const loginAdminBtn = document.getElementById("loginAdminBtn");
const adminPasswordInput = document.getElementById("adminPasswordInput");
const adminCabinetBtn = document.getElementById("adminCabinetBtn");
const adminCabinetModal = document.getElementById("adminCabinetModal");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");

if (localStorage.getItem("isAdmin") === "true") {
    document.body.classList.add("admin-mode-active");
}

if (loginAdminBtn) {
    loginAdminBtn.addEventListener("click", () => {
        const phone = document.getElementById("checkPhoneInput").value.replace(/\D/g, '');
        const password = adminPasswordInput ? adminPasswordInput.value : "";
        
        loginAdminBtn.innerText = "Перевірка...";
        if (phone === "0680011001" && password === "lviv_avokado2007") {
            document.body.classList.add("admin-mode-active");
            localStorage.setItem("isAdmin", "true"); 
            alert("✅ Вітаємо в панелі управління, Бос!");
            if(checkBookingModal) checkBookingModal.style.display = "none";
        } else {
            alert("❌ Невірний пароль!");
        }
        loginAdminBtn.innerText = "Увійти в систему";
    });
}

if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener("click", () => {
        document.body.classList.remove("admin-mode-active");
        localStorage.removeItem("isAdmin"); 
        if(adminCabinetModal) adminCabinetModal.style.display = "none";
        alert("Ви успішно вийшли з адміністративного акаунта.");
    });
}

if (adminCabinetBtn) {
    adminCabinetBtn.addEventListener("click", () => {
        if(adminCabinetModal) adminCabinetModal.style.display = "flex";
        switchCabinetView('cabinetMenuSection'); 
    });
}

window.switchCabinetView = function(viewId) {
    ['cabinetMenuSection', 'upcomingBookingsView', 'clientDatabaseView', 'scheduleEditingView', 'priceEditingView', 'certificatesEditingView', 'masterProfileEditingView'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.style.display = 'none';
    });
    const activeView = document.getElementById(viewId);
    if(activeView) activeView.style.display = 'block';

    if (viewId === 'upcomingBookingsView' || viewId === 'clientDatabaseView') loadAdminData();
    if (viewId === 'priceEditingView') renderAdminPriceList();
    if (viewId === 'certificatesEditingView') renderAdminCerts();
    if (viewId === 'masterProfileEditingView') renderAdminMasterProfile(); // НОВИЙ РЯДОК
};
// ==========================================
// 10. АДМІН-ПАНЕЛЬ (БАЗА ТА ЗАПИСИ)
// ==========================================
async function loadAdminData() {
    const adminTbody = document.getElementById("adminTableBody");
    const upcomingTbody = document.getElementById("upcomingTableBody");
    
    if(adminTbody) adminTbody.innerHTML = "<tr><td colspan='5' style='text-align:center;'>Завантаження даних... ⏳</td></tr>";
    if(upcomingTbody) upcomingTbody.innerHTML = "<tr><td colspan='5' style='text-align:center;'>Завантаження записів... ⏳</td></tr>";
    
    const { data: bookings, error } = await supabaseClient
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });
        
    if (error) {
        if(adminTbody) adminTbody.innerHTML = "<tr><td colspan='5' style='text-align:center; color:red;'>Помилка підключення до бази</td></tr>";
        return;
    }

    const clients = {};
    bookings.forEach(b => {
        if (!clients[b.client_phone]) {
            clients[b.client_phone] = { name: b.client_name, phone: b.client_phone, lastBooking: b.booking_date, count: 0 };
        }
        clients[b.client_phone].count++; 
    });

    const clientArray = Object.values(clients);
    if(document.getElementById("totalClientsCount")) document.getElementById("totalClientsCount").innerText = clientArray.length;
    if(document.getElementById("totalBookingsCount")) document.getElementById("totalBookingsCount").innerText = bookings.length;

    renderAdminTable(clientArray);

    const adminSearchInput = document.getElementById("adminSearchInput");
    if(adminSearchInput) {
        // Щоб уникнути дублювання подій, робимо це так:
        adminSearchInput.oninput = (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = clientArray.filter(c => c.name.toLowerCase().includes(term) || c.phone.includes(term));
            renderAdminTable(filtered);
        };
    }

    if (upcomingTbody) {
        upcomingTbody.innerHTML = "";
        const today = new Date();
        const monthNames = ["січня", "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"];
        const todayStr = `${today.getDate()} ${monthNames[today.getMonth()]}`;

        if (bookings.length === 0) {
            upcomingTbody.innerHTML = "<tr><td colspan='5' style='text-align:center;'>Записів ще немає</td></tr>";
        } else {
            bookings.forEach(b => {
                let tr = document.createElement("tr");
                const isToday = b.booking_date.includes(todayStr);
                if (isToday) tr.classList.add("today-booking");
                
                tr.innerHTML = `
                    <td>${b.client_name} ${isToday ? '<span class="today-badge">СЬОГОДНІ</span>' : ''}</td>
                    <td>${b.client_phone}</td>
                    <td>${b.booking_date}</td>
                    <td style="font-size: 0.85rem; color: #aaa;">${b.services}</td>
                    <td><button class="delete-booking-btn" onclick="deleteBooking('${b.id}')" title="Скасувати запис">❌</button></td>
                `;
                upcomingTbody.appendChild(tr);
            });
        }
    }
}

function renderAdminTable(dataArray) {
    const tbody = document.getElementById("adminTableBody");
    if(!tbody) return;
    tbody.innerHTML = "";
    if (dataArray.length === 0) {
        tbody.innerHTML = "<tr><td colspan='5' style='text-align:center;'>Нічого не знайдено</td></tr>";
        return;
    }
    dataArray.forEach(client => {
        let tr = document.createElement("tr");
        tr.innerHTML = `
            <td contenteditable="true" class="editable-cell" title="Натисніть, щоб змінити">${client.name}</td>
            <td contenteditable="true" class="editable-cell" title="Натисніть, щоб змінити">${client.phone}</td>
            <td>${client.lastBooking}</td>
            <td>${client.count}</td>
            <td><button class="edit-cell-btn" title="Зберегти зміни">💾</button></td>
        `;
        tbody.appendChild(tr);
    });
}

window.deleteBooking = async function(bookingId) {
    const isConfirmed = confirm("Ви впевнені, що хочете скасувати цей запис? Відмінити цю дію буде неможливо.");
    if (isConfirmed) {
        const { error } = await supabaseClient.from('bookings').delete().eq('id', bookingId);
        if (error) {
            console.error("Помилка видалення:", error);
            alert("Сталася помилка при видаленні 😔 Спробуйте ще раз.");
        } else {
            alert("✅ Запис успішно скасовано!");
            loadAdminData();
        }
    }
};

// ==========================================
// 11. АДМІН-ПАНЕЛЬ (РЕДАГУВАННЯ ГРАФІКА)
// ==========================================
// 11.1 Вихідні
const vacationDateInput = document.getElementById("vacationDateInput");
const addVacationBtn = document.getElementById("addVacationBtn");
const vacationTagsContainer = document.getElementById("vacationTagsContainer");
let savedVacations = JSON.parse(localStorage.getItem("adminVacations")) || [];

function renderVacationTags() {
    if(!vacationTagsContainer) return;
    vacationTagsContainer.innerHTML = "";
    if (savedVacations.length === 0) {
        vacationTagsContainer.innerHTML = "<span style='color: #555;'>Немає запланованих вихідних</span>";
        return;
    }
    savedVacations.sort();
    savedVacations.forEach(date => {
        let tag = document.createElement("div");
        tag.classList.add("vacation-tag");
        const [y, m, d] = date.split('-');
        tag.innerHTML = `${d}.${m}.${y} <button class="delete-tag-btn" onclick="removeVacation('${date}')">&times;</button>`;
        vacationTagsContainer.appendChild(tag);
    });
}

if (addVacationBtn) {
    addVacationBtn.addEventListener("click", () => {
        const selectedDate = vacationDateInput.value;
        if (!selectedDate) return alert("Оберіть дату!");
        if (!savedVacations.includes(selectedDate)) {
            savedVacations.push(selectedDate);
            localStorage.setItem("adminVacations", JSON.stringify(savedVacations));
            renderVacationTags();
            if(vacationDateInput) vacationDateInput.value = ""; 
            if(calendarModal && calendarModal.style.display === "flex") generateDays(); 
        } else {
            alert("Цей день вже відмічено як вихідний!");
        }
    });
}

window.removeVacation = function(dateToRemove) {
    savedVacations = savedVacations.filter(date => date !== dateToRemove);
    localStorage.setItem("adminVacations", JSON.stringify(savedVacations));
    renderVacationTags();
    if(calendarModal && calendarModal.style.display === "flex") generateDays(); 
};
renderVacationTags();

// 11.2 Тижневий Графік
const dayOfWeekSelect = document.getElementById("dayOfWeekSelect");
const timeSlotInput = document.getElementById("timeSlotInput");
const addTimeSlotBtn = document.getElementById("addTimeSlotBtn");
const timeTagsContainer = document.getElementById("timeTagsContainer");
let defaultSchedule = {
    1: ["10:00", "12:00", "14:00", "16:00"], 2: ["10:00", "12:00", "14:00", "16:00"],
    3: ["10:00", "12:00", "14:00", "16:00"], 4: ["10:00", "12:00", "14:00", "16:00"],
    5: ["10:00", "12:00", "14:00", "16:00"], 6: ["11:00", "13:00", "15:00"], 0: []
};
let weeklySchedule = JSON.parse(localStorage.getItem("adminWeeklySchedule")) || defaultSchedule;

function renderTimeTags() {
    if (!timeTagsContainer || !dayOfWeekSelect) return;
    const selectedDay = dayOfWeekSelect.value;
    const times = weeklySchedule[selectedDay] || [];
    timeTagsContainer.innerHTML = "";
    if (times.length === 0) {
        timeTagsContainer.innerHTML = "<span style='color: #555;'>У цей день немає прийомів (Вихідний)</span>";
        return;
    }
    times.sort();
    times.forEach(time => {
        let tag = document.createElement("div");
        tag.classList.add("time-tag");
        tag.innerHTML = `${time} <button class="delete-tag-btn" onclick="removeTimeSlot('${selectedDay}', '${time}')" style="color:#888;">&times;</button>`;
        timeTagsContainer.appendChild(tag);
    });
}

if (dayOfWeekSelect) dayOfWeekSelect.addEventListener("change", renderTimeTags);
if (addTimeSlotBtn) {
    addTimeSlotBtn.addEventListener("click", () => {
        const selectedDay = dayOfWeekSelect.value;
        const newTime = timeSlotInput.value;
        if (!newTime) return alert("Оберіть час!");
        if (!weeklySchedule[selectedDay].includes(newTime)) {
            weeklySchedule[selectedDay].push(newTime);
            localStorage.setItem("adminWeeklySchedule", JSON.stringify(weeklySchedule));
            renderTimeTags();
            if(timeSlotInput) timeSlotInput.value = "";
        } else {
            alert("Цей час вже є у графіку на цей день!");
        }
    });
}
window.removeTimeSlot = function(day, timeToRemove) {
    weeklySchedule[day] = weeklySchedule[day].filter(time => time !== timeToRemove);
    localStorage.setItem("adminWeeklySchedule", JSON.stringify(weeklySchedule));
    renderTimeTags();
};
renderTimeTags();

// 11.3 Особливий Графік на Дату
const specificDateInput = document.getElementById("specificDateInput");
const specificTimeInput = document.getElementById("specificTimeInput");
const addSpecificTimeBtn = document.getElementById("addSpecificTimeBtn");
const specificTimeTagsContainer = document.getElementById("specificTimeTagsContainer");
let specificSchedule = JSON.parse(localStorage.getItem("adminSpecificSchedule")) || {};

function renderSpecificTimeTags() {
    if (!specificTimeTagsContainer || !specificDateInput) return;
    const selectedDate = specificDateInput.value;
    if (!selectedDate) {
        specificTimeTagsContainer.innerHTML = "<span style='color: #555;'>Оберіть дату, щоб побачити або змінити її години</span>";
        return;
    }
    const times = specificSchedule[selectedDate] || [];
    specificTimeTagsContainer.innerHTML = "";
    if (times.length === 0) {
        specificTimeTagsContainer.innerHTML = "<span style='color: #555;'>Немає особливих годин. Буде діяти стандартний тижневий графік.</span>";
        return;
    }
    times.sort();
    times.forEach(time => {
        let tag = document.createElement("div");
        tag.classList.add("time-tag");
        tag.innerHTML = `${time} <button class="delete-tag-btn" onclick="removeSpecificTimeSlot('${selectedDate}', '${time}')" style="color:#888;">&times;</button>`;
        specificTimeTagsContainer.appendChild(tag);
    });
}

if (specificDateInput) specificDateInput.addEventListener("change", renderSpecificTimeTags);
if (addSpecificTimeBtn) {
    addSpecificTimeBtn.addEventListener("click", () => {
        const date = specificDateInput.value;
        const time = specificTimeInput.value;
        if (!date || !time) return alert("Оберіть дату та час!");
        if (!specificSchedule[date]) specificSchedule[date] = [];
        if (!specificSchedule[date].includes(time)) {
            specificSchedule[date].push(time);
            localStorage.setItem("adminSpecificSchedule", JSON.stringify(specificSchedule));
            renderSpecificTimeTags();
            if(specificTimeInput) specificTimeInput.value = "";
        } else {
            alert("Цей час вже додано на цю дату!");
        }
    });
}
window.removeSpecificTimeSlot = function(date, timeToRemove) {
    specificSchedule[date] = specificSchedule[date].filter(time => time !== timeToRemove);
    if (specificSchedule[date].length === 0) delete specificSchedule[date]; 
    localStorage.setItem("adminSpecificSchedule", JSON.stringify(specificSchedule));
    renderSpecificTimeTags();
};

// ==========================================
// 12. ВІДГУКИ (КАРУСЕЛЬ ТА ЗАВАНТАЖЕННЯ)
// ==========================================
const reviewsModal = document.getElementById("reviewsModal");
const openReviewsBtn = document.getElementById("openReviewsBtn");
const carouselImage = document.getElementById("carouselImage");
const prevBtn = document.querySelector(".prev-btn");
const nextBtn = document.querySelector(".next-btn");
const carouselCounter = document.getElementById("carouselCounter");

let currentReviewIndex = 0;
let reviewImages = []; 

async function loadReviewsFromDB() {
    const { data, error } = await supabaseClient
        .from('reviews')
        .select('image_data')
        .order('created_at', { ascending: false }); 

    if (data && data.length > 0) {
        reviewImages = data.map(item => item.image_data);
    } else {
        reviewImages = ["https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&q=80"];
    }
    updateCarousel();
}
loadReviewsFromDB();

const reviewFileInput = document.getElementById('reviewFileInput');
if (reviewFileInput) {
    reviewFileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = async function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const TARGET_WIDTH = 800;
                const TARGET_HEIGHT = 1000;
                canvas.width = TARGET_WIDTH;
                canvas.height = TARGET_HEIGHT;

                let srcX = 0, srcY = 0, srcWidth = img.width, srcHeight = img.height;
                const targetRatio = TARGET_WIDTH / TARGET_HEIGHT;
                const imgRatio = img.width / img.height;

                if (imgRatio > targetRatio) {
                    srcWidth = img.height * targetRatio;
                    srcX = (img.width - srcWidth) / 2;
                } else {
                    srcHeight = img.width / targetRatio;
                    srcY = (img.height - srcHeight) / 2;
                }
                ctx.drawImage(img, srcX, srcY, srcWidth, srcHeight, 0, 0, TARGET_WIDTH, TARGET_HEIGHT);
                const base64Image = canvas.toDataURL('image/jpeg', 0.8);
                
                const btn = document.querySelector('.add-review-btn');
                if(btn) btn.innerText = "Завантажуємо... ⏳";
                
                const { error } = await supabaseClient.from('reviews').insert([{ image_data: base64Image }]);
                
                if(btn) btn.innerText = "📸 Додати відгук";
                if (error) {
                    alert("Помилка завантаження 😔");
                    console.error(error);
                } else {
                    alert("✅ Відгук успішно додано!");
                    loadReviewsFromDB(); 
                }
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function updateCarousel() {
    if(carouselImage && reviewImages.length > 0) {
        carouselImage.src = reviewImages[currentReviewIndex];
        if(carouselCounter) carouselCounter.innerText = `${currentReviewIndex + 1} / ${reviewImages.length}`;
    }
}

if (openReviewsBtn && reviewsModal) {
    openReviewsBtn.addEventListener("click", () => {
        currentReviewIndex = 0; 
        updateCarousel();
        reviewsModal.style.display = "flex";
    });
}

if(nextBtn) {
    nextBtn.addEventListener("click", () => {
        if(reviewImages.length > 0) {
            currentReviewIndex = (currentReviewIndex + 1) % reviewImages.length;
            updateCarousel();
        }
    });
}
if(prevBtn) {
    prevBtn.addEventListener("click", () => {
        if(reviewImages.length > 0) {
            currentReviewIndex = (currentReviewIndex - 1 + reviewImages.length) % reviewImages.length;
            updateCarousel();
        }
    });
}

// ==========================================
// 13. СЕРТИФІКАТИ
// ==========================================
const certModal = document.getElementById("certModal");
const fullCertImage = document.getElementById("fullCertImage");

window.openCert = function(imageSrc) {
    if(fullCertImage && certModal) {
        fullCertImage.src = imageSrc;
        certModal.style.display = "flex";
    }
};
// ==========================================
// 14. ДИНАМІЧНІ СЕРТИФІКАТИ
// ==========================================
const certStatusNo = document.getElementById("certStatusNo");
const certStatusYes = document.getElementById("certStatusYes");
const certUploadContainer = document.getElementById("certUploadContainer");
const adminCertList = document.getElementById("adminCertList");
const certFileInputAdmin = document.getElementById("certFileInputAdmin");
const certificatesSectionClient = document.getElementById("certificatesSectionClient");
const certCarouselContainer = document.getElementById("certCarouselContainer");

// Витягуємо налаштування з пам'яті (за замовчуванням показуємо демо)
let certStatus = localStorage.getItem("adminCertStatus") || "yes";
let savedCerts = JSON.parse(localStorage.getItem("adminCertList")) || [
    "https://images.unsplash.com/photo-1589330694653-efa6482d8cbb?auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1574607383471-155018a1a3de?auto=format&fit=crop&q=80"
];

// Малюємо сертифікати на головній сторінці для клієнта
function renderClientCerts() {
    if (!certificatesSectionClient || !certCarouselContainer) return;
    
    // Якщо адмін вибрав "Ні" або немає жодного сертифікату - ховаємо весь блок
    if (certStatus === "no" || savedCerts.length === 0) {
        certificatesSectionClient.style.display = "none";
    } else {
        certificatesSectionClient.style.display = "block";
        certCarouselContainer.innerHTML = "";
        
        savedCerts.forEach(src => {
            let img = document.createElement("img");
            img.src = src;
            img.className = "cert-img";
            img.alt = "Сертифікат";
            img.onclick = () => window.openCert(src);
            certCarouselContainer.appendChild(img);
        });
    }
}

// Малюємо вікно налаштувань у Кабінеті Адміністратора
window.renderAdminCerts = function() {
    if (certStatusNo && certStatusYes && certUploadContainer) {
        if (certStatus === "yes") {
            certStatusYes.checked = true;
            certUploadContainer.style.display = "block";
        } else {
            certStatusNo.checked = true;
            certUploadContainer.style.display = "none";
        }
    }

    if (adminCertList) {
        adminCertList.innerHTML = "";
        savedCerts.forEach((src, index) => {
            let wrapper = document.createElement("div");
            wrapper.style.position = "relative";
            wrapper.style.display = "inline-block";
            
            let img = document.createElement("img");
            img.src = src;
            img.style.width = "100px";
            img.style.height = "100px";
            img.style.objectFit = "cover";
            img.style.borderRadius = "8px";
            img.style.border = "1px solid #444";
            
            // Кнопка видалення (хрестик)
            let delBtn = document.createElement("button");
            delBtn.innerHTML = "❌";
            delBtn.style.position = "absolute";
            delBtn.style.top = "-8px";
            delBtn.style.right = "-8px";
            delBtn.style.background = "#1a1a1a";
            delBtn.style.border = "1px solid #333";
            delBtn.style.borderRadius = "50%";
            delBtn.style.cursor = "pointer";
            delBtn.style.padding = "4px";
            
            delBtn.onclick = () => {
                savedCerts.splice(index, 1);
                localStorage.setItem("adminCertList", JSON.stringify(savedCerts));
                renderAdminCerts();
                renderClientCerts();
            };
            
            wrapper.appendChild(img);
            wrapper.appendChild(delBtn);
            adminCertList.appendChild(wrapper);
        });
    }
}

// Слухаємо перемикачі (Так/Ні)
if (certStatusNo && certStatusYes) {
    certStatusNo.addEventListener("change", () => {
        certStatus = "no";
        localStorage.setItem("adminCertStatus", "no");
        renderAdminCerts();
        renderClientCerts();
    });
    certStatusYes.addEventListener("change", () => {
        certStatus = "yes";
        localStorage.setItem("adminCertStatus", "yes");
        renderAdminCerts();
        renderClientCerts();
    });
}

// Завантаження нового фото (стиснення перед збереженням)
if (certFileInputAdmin) {
    certFileInputAdmin.addEventListener("change", function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                
                // Стискаємо, щоб не переповнити пам'ять браузера
                const MAX_WIDTH = 800;
                let width = img.width;
                let height = img.height;
                
                if (width > MAX_WIDTH) {
                    height = Math.round((height * MAX_WIDTH) / width);
                    width = MAX_WIDTH;
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                // Зберігаємо як стиснений JPEG
                const base64Image = canvas.toDataURL("image/jpeg", 0.7);
                savedCerts.push(base64Image);
                
                try {
                    localStorage.setItem("adminCertList", JSON.stringify(savedCerts));
                    renderAdminCerts();
                    renderClientCerts();
                } catch (err) {
                    alert("⚠️ Пам'ять браузера переповнена! Видаліть старі сертифікати перед додаванням нових.");
                    savedCerts.pop(); 
                }
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Запускаємо перевірку одразу при завантаженні сайту
renderClientCerts();
// ==========================================
// 15. ПРОФІЛЬ МАЙСТРА ТА ПОРТФОЛІО
// ==========================================
// Елементи клієнта (Головна)
const clientMasterImg = document.getElementById("clientMasterImg");
const clientMasterName = document.getElementById("clientMasterName");
const clientMasterDesc = document.getElementById("clientMasterDesc");
const portfolioSectionClient = document.getElementById("portfolioSectionClient");
const portfolioCarouselContainer = document.getElementById("portfolioCarouselContainer");

// Елементи адмінки
const adminMasterNameInput = document.getElementById("adminMasterNameInput");
const adminMasterDescInput = document.getElementById("adminMasterDescInput");
const adminMasterPhotoPreview = document.getElementById("adminMasterPhotoPreview");
const saveMasterInfoBtn = document.getElementById("saveMasterInfoBtn");
const masterPhotoUpload = document.getElementById("masterPhotoUpload");

const portfolioStatusNo = document.getElementById("portfolioStatusNo");
const portfolioStatusYes = document.getElementById("portfolioStatusYes");
const portfolioUploadContainer = document.getElementById("portfolioUploadContainer");
const portfolioFileInput = document.getElementById("portfolioFileInput");
const adminPortfolioList = document.getElementById("adminPortfolioList");

// --- Базові дані (якщо ще нічого не змінювали) ---
const defaultMasterName = "Ваш майстер";
const defaultMasterDesc = "Привіт! Я — топ-майстер з досвідом понад 5 років...\n\nПрацюю виключно на преміум-матеріалах.";
const defaultMasterPhoto = "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80";

// --- Завантажуємо з пам'яті ---
let savedMasterName = localStorage.getItem("adminMasterName") || defaultMasterName;
let savedMasterDesc = localStorage.getItem("adminMasterDesc") || defaultMasterDesc;
let savedMasterPhoto = localStorage.getItem("adminMasterPhoto") || defaultMasterPhoto;

let portfolioStatus = localStorage.getItem("adminPortfolioStatus") || "no";
let savedPortfolio = JSON.parse(localStorage.getItem("adminPortfolioList")) || [];

// --- Функція: Оновлення сторінки клієнта ---
function renderClientMasterProfile() {
    if (clientMasterName) clientMasterName.innerText = savedMasterName;
    if (clientMasterDesc) clientMasterDesc.innerText = savedMasterDesc;
    if (clientMasterImg) clientMasterImg.src = savedMasterPhoto;

    // Портфоліо
    if (portfolioSectionClient && portfolioCarouselContainer) {
        if (portfolioStatus === "no" || savedPortfolio.length === 0) {
            portfolioSectionClient.style.display = "none";
        } else {
            portfolioSectionClient.style.display = "block";
            portfolioCarouselContainer.innerHTML = "";
            savedPortfolio.forEach(src => {
                let img = document.createElement("img");
                img.src = src;
                img.className = "cert-img"; // Використовуємо ті ж стилі, що й для сертифікатів
                img.alt = "Робота майстра";
                // Додаємо можливість відкрити на весь екран через ту ж модалку
                img.onclick = () => window.openCert(src); 
                portfolioCarouselContainer.appendChild(img);
            });
        }
    }
}

// --- Функція: Відображення в Адмінці ---
window.renderAdminMasterProfile = function() {
    if (adminMasterNameInput) adminMasterNameInput.value = savedMasterName;
    if (adminMasterDescInput) adminMasterDescInput.value = savedMasterDesc;
    if (adminMasterPhotoPreview) adminMasterPhotoPreview.src = savedMasterPhoto;

    if (portfolioStatusNo && portfolioStatusYes && portfolioUploadContainer) {
        if (portfolioStatus === "yes") {
            portfolioStatusYes.checked = true;
            portfolioUploadContainer.style.display = "block";
        } else {
            portfolioStatusNo.checked = true;
            portfolioUploadContainer.style.display = "none";
        }
    }

    if (adminPortfolioList) {
        adminPortfolioList.innerHTML = "";
        savedPortfolio.forEach((src, index) => {
            let wrapper = document.createElement("div");
            wrapper.style.position = "relative";
            wrapper.style.display = "inline-block";
            
            let img = document.createElement("img");
            img.src = src;
            img.style.width = "100px";
            img.style.height = "100px";
            img.style.objectFit = "cover";
            img.style.borderRadius = "8px";
            
            let delBtn = document.createElement("button");
            delBtn.innerHTML = "❌";
            delBtn.style.position = "absolute";
            delBtn.style.top = "-8px";
            delBtn.style.right = "-8px";
            delBtn.style.background = "#1a1a1a";
            delBtn.style.border = "1px solid #333";
            delBtn.style.borderRadius = "50%";
            delBtn.style.cursor = "pointer";
            delBtn.style.padding = "4px";
            
            delBtn.onclick = () => {
                savedPortfolio.splice(index, 1);
                localStorage.setItem("adminPortfolioList", JSON.stringify(savedPortfolio));
                renderAdminMasterProfile();
                renderClientMasterProfile();
            };
            
            wrapper.appendChild(img);
            wrapper.appendChild(delBtn);
            adminPortfolioList.appendChild(wrapper);
        });
    }
}

// --- Збереження тексту та імені ---
if (saveMasterInfoBtn) {
    saveMasterInfoBtn.addEventListener("click", () => {
        savedMasterName = adminMasterNameInput.value.trim() || defaultMasterName;
        savedMasterDesc = adminMasterDescInput.value.trim() || defaultMasterDesc;
        
        localStorage.setItem("adminMasterName", savedMasterName);
        localStorage.setItem("adminMasterDesc", savedMasterDesc);
        
        renderClientMasterProfile();
        alert("✅ Дані майстра збережено!");
    });
}

// --- Завантаження головного фото ---
if (masterPhotoUpload) {
    masterPhotoUpload.addEventListener("change", function(e) {
        compressAndSaveImage(e.target.files[0], (base64) => {
            savedMasterPhoto = base64;
            localStorage.setItem("adminMasterPhoto", savedMasterPhoto);
            renderAdminMasterProfile();
            renderClientMasterProfile();
        });
    });
}

// --- Перемикачі Портфоліо ---
if (portfolioStatusNo && portfolioStatusYes) {
    portfolioStatusNo.addEventListener("change", () => {
        portfolioStatus = "no";
        localStorage.setItem("adminPortfolioStatus", "no");
        renderAdminMasterProfile();
        renderClientMasterProfile();
    });
    portfolioStatusYes.addEventListener("change", () => {
        portfolioStatus = "yes";
        localStorage.setItem("adminPortfolioStatus", "yes");
        renderAdminMasterProfile();
        renderClientMasterProfile();
    });
}

// --- Завантаження фото в Портфоліо ---
if (portfolioFileInput) {
    portfolioFileInput.addEventListener("change", function(e) {
        compressAndSaveImage(e.target.files[0], (base64) => {
            savedPortfolio.push(base64);
            try {
                localStorage.setItem("adminPortfolioList", JSON.stringify(savedPortfolio));
                renderAdminMasterProfile();
                renderClientMasterProfile();
            } catch (err) {
                alert("⚠️ Пам'ять браузера переповнена! Видаліть старі фото перед додаванням нових.");
                savedPortfolio.pop();
            }
        });
    });
}

// --- Універсальна функція стиснення картинок ---
function compressAndSaveImage(file, callback) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            
            const MAX_WIDTH = 800; // Стискаємо до 800px по ширині
            let width = img.width;
            let height = img.height;
            
            if (width > MAX_WIDTH) {
                height = Math.round((height * MAX_WIDTH) / width);
                width = MAX_WIDTH;
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            const base64Image = canvas.toDataURL("image/jpeg", 0.7);
            callback(base64Image);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// Запуск при старті
renderClientMasterProfile();
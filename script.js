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
// 5. ВІДПРАВКА ЗАПИСУ (З ПІДРАХУНКОМ ЧАСУ)
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
        let totalDuration = 0; // Змінна для підрахунку загального часу

        document.querySelectorAll('.modal-service-cb:checked').forEach(cb => {
            selectedServices.push(cb.value);
            // Додаємо час кожної обраної послуги
            totalDuration += parseInt(cb.getAttribute("data-duration")) || 60; 
        });

        if (selectedServices.length === 0) return alert("❌ Будь ласка, оберіть хоча б одну послугу!");
        if (!dateTime) return alert("❌ Будь ласка, оберіть дату та час!");

        const submitBtn = document.querySelector("#bookingForm .submit-btn");
        const originalText = submitBtn.innerText;
        submitBtn.innerText = "Відправляємо... ⏳";
        submitBtn.disabled = true;

        // ВІДПРАВЛЯЄМО ЗАПИС ІЗ ТРИВАЛІСТЮ (total_duration)
        const { error } = await supabaseClient.from('bookings').insert([{ 
            client_name: name, 
            client_phone: phone, 
            services: selectedServices.join(' | '),
            booking_date: dateTime,
            comment: comment,
            total_duration: totalDuration 
        }]);

        submitBtn.innerText = originalText;
        submitBtn.disabled = false;

        if (error) {
            console.error("Помилка Supabase:", error);
            alert("❌ Ой, сталась помилка при записі. Спробуйте ще раз.");
        } else {
            alert("✅ Ваш запис успішно підтверджено! Чекаємо на вас.");
            
            const bookingModal = document.getElementById("bookingModal");
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
    if (window.scheduleData.specific[dateString] && window.scheduleData.specific[dateString].length > 0) {
        availableHours = window.scheduleData.specific[dateString];
    } else {
        availableHours = window.scheduleData.weekly[dayOfWeek] || [];
    }

    if (availableHours.length === 0) {
        timeSlots.innerHTML = "<p style='grid-column: span 3; text-align: center; color: #888;'>У цей день немає прийомів</p>";
        return;
    }

    // Витягуємо записи на обрану дату разом з їхньою тривалістю
    const { data: bookings } = await supabaseClient
        .from('bookings')
        .select('booking_date, total_duration')
        .like('booking_date', `${selectedDate}%`); 

    // Функція конвертації часу "HH:MM" у хвилини від початку доби (напр. "10:30" -> 630)
    const timeToMinutes = (timeStr) => {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    };

    // Формуємо масив зайнятих інтервалів [startMin, endMin]
    const bookedIntervals = bookings ? bookings.map(b => {
        const timeStr = b.booking_date.split(', ')[1];
        const startMin = timeToMinutes(timeStr);
        const duration = b.total_duration || 60;
        return { start: startMin, end: startMin + duration };
    }) : [];

    timeSlots.innerHTML = "";

  // ... [початок функції залишається без змін до моменту перебору availableHours]

    const today = new Date();
    // Перевіряємо, чи обраний день є сьогоднішнім
    const isToday = (year === today.getFullYear() && monthIndex === today.getMonth() && dayNumber === today.getDate());
    const currentMinutes = today.getHours() * 60 + today.getMinutes();

    timeSlots.innerHTML = "";

    availableHours.forEach(time => {
        let timeBtn = document.createElement("div");
        timeBtn.classList.add("time-box");
        timeBtn.innerText = time;

        const slotMin = timeToMinutes(time);
        
        // 1. ПЕРЕВІРКА МИНУЛОГО ЧАСУ (якщо сьогодні)
        if (isToday && slotMin <= currentMinutes) {
            timeBtn.classList.add("booked");
            timeBtn.style.opacity = "0.4"; // Робимо його тьмяним
            timeBtn.style.cursor = "not-allowed";
            timeBtn.addEventListener("click", () => showToast("Цей час вже минув! ⏳"));
            timeSlots.appendChild(timeBtn);
            return; // Зупиняємо логіку для цього слоту і йдемо до наступного
        }
        
        // 2. ПЕРЕВІРКА ПЕРЕТИНУ З ІНШИМИ ЗАПИСАМИ (твоя поточна логіка)
        const isOverlap = bookedIntervals.some(interval => slotMin >= interval.start && slotMin < interval.end);

        if (isOverlap) {
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
// 7. ДИНАМІЧНИЙ ПРАЙС-ЛИСТ (БЕКЕНД SUPABASE)
// ==========================================
const mainPriceList = document.getElementById("mainPriceList");
const bookingServicesList = document.getElementById("bookingServicesList");
const adminPriceTableBody = document.getElementById("adminPriceTableBody");
const editPriceBtnHero = document.getElementById("editPriceBtnHero");

let activeServices = [];

// --- Зчитування прайсу з бази даних ---
async function fetchServices() {
    // Робимо запит до таблиці services, RLS пропустить, бо SELECT дозволений усім
    const { data, error } = await supabaseClient
        .from('services')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        console.error("Помилка завантаження прайсу:", error);
        return;
    }
    
    activeServices = data || [];
    renderClientPriceList();
    if (document.body.classList.contains("admin-mode-active")) {
        renderAdminPriceList();
    }
}

// --- Малювання прайсу для клієнтів ---
function renderClientPriceList() {
    if (mainPriceList) mainPriceList.innerHTML = "";
    if (bookingServicesList) bookingServicesList.innerHTML = "";

    activeServices.forEach((service, index) => {
        // 1. Головна сторінка
        if (mainPriceList) {
            let item = document.createElement("div");
            item.className = "price-item hidden";
            item.style.transitionDelay = `${index * 0.1}s`;
            item.innerHTML = `
                <div class="price-name">${service.name}</div>
                <div class="price-value">${service.price} ₴</div>
            `;
            
            item.addEventListener("click", () => {
                const bookingModal = document.getElementById("bookingModal");
                if (bookingModal) bookingModal.style.display = "flex";
                
                document.querySelectorAll(".modal-service-cb").forEach(cb => {
                    cb.checked = (cb.value === service.name);
                });
            });
            mainPriceList.appendChild(item);
            observer.observe(item); // Анімація появи
        }

        // 2. Чекбокси у модалці запису (додано data-duration для майбутнього підрахунку)
        if (bookingServicesList) {
            bookingServicesList.innerHTML += `
                <label class="custom-checkbox">
                    <input type="checkbox" value="${service.name}" class="modal-service-cb" data-duration="${service.duration}"> 
                    <span>${service.name} - ${service.price} ₴</span>
                </label>
            `;
        }
    });
}

// ОДРАЗУ ВИКЛИКАЄМО ФУНКЦІЮ ПРИ ЗАВАНТАЖЕННІ СТОРІНКИ
fetchServices();

// --- Відкриття кабінету ---
if (editPriceBtnHero) {
    editPriceBtnHero.addEventListener("click", () => {
        const adminCabinetModal = document.getElementById("adminCabinetModal");
        if(adminCabinetModal) adminCabinetModal.style.display = "flex";
        switchCabinetView('priceEditingView');
    });
}

// --- ЛОГІКА РЕДАГУВАННЯ В КАБІНЕТІ ---
// --- ЛОГІКА РЕДАГУВАННЯ В КАБІНЕТІ (З ЧАСОМ) ---
function renderAdminPriceList() {
    if (!adminPriceTableBody) return;
    adminPriceTableBody.innerHTML = "";
    
    if (activeServices.length === 0) {
        // Зверни увагу: colspan='4', бо тепер у нас 4 колонки в HTML
        adminPriceTableBody.innerHTML = "<tr><td colspan='4' style='text-align:center;'>Список порожній</td></tr>";
        return;
    }

    activeServices.forEach(service => {
        let tr = document.createElement("tr");
        tr.innerHTML = `
            <td style="text-align: left;">${service.name}</td>
            <td>${service.price} ₴</td>
            <td style="color: var(--accent-pink);">${service.duration} хв</td> <!-- ДОДАНО ЧАС -->
            <td><button class="delete-booking-btn" onclick="deleteService(${service.id})" title="Видалити послугу">❌</button></td>
        `;
        adminPriceTableBody.appendChild(tr);
    });
}

// --- ДОДАВАННЯ НОВОЇ ПОСЛУГИ В БАЗУ (З ЧАСОМ) ---
const addNewServiceBtn = document.getElementById("addNewServiceBtn");
if (addNewServiceBtn) {
    addNewServiceBtn.addEventListener("click", async () => {
        const nameInput = document.getElementById("newServiceName");
        const priceInput = document.getElementById("newServicePrice");
        const durationInput = document.getElementById("newServiceDuration"); // Зчитуємо нове поле
        
        const name = nameInput.value.trim();
        const price = parseInt(priceInput.value);
        const duration = parseInt(durationInput.value) || 60; // За замовчуванням 60 хв, якщо поле пусте

        if (!name || isNaN(price) || isNaN(duration)) {
            return alert("❌ Введіть коректну назву, ціну та тривалість (у хвилинах)!");
        }

        addNewServiceBtn.innerText = "Додаємо... ⏳";
        addNewServiceBtn.disabled = true;

        // Записуємо дані у Supabase
        const { error } = await supabaseClient.from('services').insert([{ 
            name: name, 
            price: price, 
            duration: duration 
        }]);

        addNewServiceBtn.innerText = "Додати";
        addNewServiceBtn.disabled = false;

        if (error) {
            console.error("Помилка додавання:", error);
            alert("❌ Відмова у доступі або помилка сервера!");
        } else {
            // Очищуємо поля
            nameInput.value = "";
            priceInput.value = "";
            durationInput.value = "60";
            
            await fetchServices(); // Перезавантажуємо прайс із бази
        }
    });
}

// --- ВИДАЛЕННЯ ПОСЛУГИ З БАЗИ ---
window.deleteService = async function(id) {
    if (confirm("Ви дійсно хочете видалити цю послугу з прайсу?")) {
        const { error } = await supabaseClient.from('services').delete().eq('id', id);
        
        if (error) {
            console.error("Помилка видалення:", error);
            alert("❌ Відмова у доступі. Ви не авторизовані!");
        } else {
            await fetchServices(); // Оновлюємо список після видалення
        }
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

// --- 1. ПЕРЕВІРКА СЕСІЇ ПРИ ЗАВАНТАЖЕННІ ---
// Тепер замість localStorage ми питаємо сервер, чи токен ще живий
async function checkAdminSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        document.body.classList.add("admin-mode-active");
    }
}
checkAdminSession();

// --- 2. НОВИЙ БЕЗПЕЧНИЙ ЛОГІН (З ПОШТОЮ ТА ПАРОЛЕМ) ---
if (loginAdminBtn) {
    loginAdminBtn.addEventListener("click", async () => {
        const phone = document.getElementById("checkPhoneInput").value.replace(/\D/g, '');
        const email = document.getElementById("adminEmailInput").value.trim();
        const password = adminPasswordInput ? adminPasswordInput.value : "";
        
        if (phone !== "0680011001") {
            alert("❌ Невідомий номер адміністратора!");
            return;
        }

        if (!email || !password) {
            alert("❌ Введіть пошту та пароль!");
            return;
        }

        loginAdminBtn.innerText = "Перевірка... ⏳";
        loginAdminBtn.disabled = true;

        // Динамічно передаємо введену пошту та пароль у Supabase
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email, 
            password: password
        });

        loginAdminBtn.innerText = "Увійти в систему";
        loginAdminBtn.disabled = false;

        if (error) {
            alert("❌ Невірний пароль, пошта або помилка сервера!");
            console.error("Помилка авторизації:", error.message);
        } else {
            document.body.classList.add("admin-mode-active");
            alert("✅ Вітаємо в панелі управління, Бос!");
            if(checkBookingModal) checkBookingModal.style.display = "none";
            // Очищуємо поля після успішного входу
            document.getElementById("adminEmailInput").value = "";
            adminPasswordInput.value = "";
        }
    });
}

// --- 3. НОВИЙ БЕЗПЕЧНИЙ ВИХІД ---
if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener("click", async () => {
        // Знищуємо токен на сервері та в браузері
        await supabaseClient.auth.signOut();
        
        document.body.classList.remove("admin-mode-active");
        if(adminCabinetModal) adminCabinetModal.style.display = "none";
        alert("🚪 Ви успішно вийшли з системи.");
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
// 10. АДМІН-ПАНЕЛЬ (БАЗА ТА СТАТУСИ ЗАПИСІВ)
// ==========================================
async function loadAdminData() {
    const adminTbody = document.getElementById("adminTableBody");
    const upcomingTbody = document.getElementById("upcomingTableBody");
    
    if(adminTbody) adminTbody.innerHTML = "<tr><td colspan='5' style='text-align:center;'>Завантаження даних... ⏳</td></tr>";
    if(upcomingTbody) upcomingTbody.innerHTML = "<tr><td colspan='6' style='text-align:center;'>Завантаження записів... ⏳</td></tr>";
    
    // Витягуємо всі записи
    const { data: bookings, error } = await supabaseClient
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });
        
    if (error) {
        if(adminTbody) adminTbody.innerHTML = "<tr><td colspan='5' style='text-align:center; color:red;'>Помилка підключення до бази</td></tr>";
        return;
    }

    // --- ЛОГІКА ДЛЯ ВКЛАДКИ "БАЗА КЛІЄНТІВ" ---
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
        adminSearchInput.oninput = (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = clientArray.filter(c => c.name.toLowerCase().includes(term) || c.phone.includes(term));
            renderAdminTable(filtered);
        };
    }

    // --- ЛОГІКА ДЛЯ ВКЛАДКИ "МАЙБУТНІ ЗАПИСИ" (ЗІ СТАТУСАМИ) ---
    if (upcomingTbody) {
        upcomingTbody.innerHTML = "";
        const today = new Date();
        const monthNames = ["січня", "лютого", "березня", "квітня", "травня", "червня", "липня", "серпня", "вересня", "жовтня", "листопада", "грудня"];
        const todayStr = `${today.getDate()} ${monthNames[today.getMonth()]}`;

        if (bookings.length === 0) {
            upcomingTbody.innerHTML = "<tr><td colspan='6' style='text-align:center;'>Записів ще немає</td></tr>";
        } else {
            // Щоб додати заголовок для статусу, потрібно переконатися, що в HTML (рядок 218) є <th>Статус</th>
            // Якщо його немає, не страшно, ми просто впишемо його в Дії
            bookings.forEach(b => {
                let tr = document.createElement("tr");
                const isToday = b.booking_date.includes(todayStr);
                if (isToday) tr.classList.add("today-booking");
                
                // Візуалізація статусу
                let statusBadge = "";
                let actionButtons = "";
                
                if (b.status === 'confirmed') {
                    statusBadge = `<span style="background: rgba(40, 167, 69, 0.2); color: #28a745; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold;">🟢 Підтверджено</span>`;
                    actionButtons = `<button class="delete-booking-btn" onclick="deleteBooking('${b.id}')" title="Скасувати запис">❌</button>`;
                } else {
                    statusBadge = `<span style="background: rgba(255, 193, 7, 0.2); color: #ffc107; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold;">🟡 Очікує</span>`;
                    actionButtons = `
                        <button class="cta-btn" onclick="confirmBooking('${b.id}')" style="padding: 5px 10px; font-size: 0.8rem; margin-right: 5px;" title="Підтвердити">✅</button>
                        <button class="delete-booking-btn" onclick="deleteBooking('${b.id}')" title="Скасувати">❌</button>
                    `;
                }
                
                tr.innerHTML = `
                    <td>${b.client_name} ${isToday ? '<span class="today-badge">СЬОГОДНІ</span>' : ''}</td>
                    <td>${b.client_phone}</td>
                    <td>${b.booking_date}</td>
                    <td style="font-size: 0.85rem; color: #aaa;">${b.services}</td>
                    <td>${statusBadge}</td>
                    <td style="white-space: nowrap;">${actionButtons}</td>
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

// --- ПІДТВЕРДЖЕННЯ ЗАПИСУ ---
window.confirmBooking = async function(bookingId) {
    const { error } = await supabaseClient
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', bookingId);
        
    if (error) {
        console.error("Помилка підтвердження:", error);
        alert("❌ Відмова у доступі. Ви не авторизовані!");
    } else {
        loadAdminData(); // Перезавантажуємо таблицю
    }
};

// --- ВИДАЛЕННЯ/СКАСУВАННЯ ЗАПИСУ ---
window.deleteBooking = async function(bookingId) {
    const isConfirmed = confirm("Ви впевнені, що хочете скасувати цей запис? Відмінити цю дію буде неможливо.");
    if (isConfirmed) {
        const { error } = await supabaseClient.from('bookings').delete().eq('id', bookingId);
        if (error) {
            console.error("Помилка видалення:", error);
            alert("❌ Сталася помилка при видаленні.");
        } else {
            loadAdminData(); // Перезавантажуємо таблицю
        }
    }
};

// ==========================================
// 11. ГРАФІК РОБОТИ ТА ВИХІДНІ (SUPABASE)
// ==========================================

// Глобальний об'єкт для зберігання розкладу в оперативній пам'яті
window.scheduleData = {
    vacations: [],
    weekly: { 1: ["10:00", "12:00", "14:00", "16:00"], 2: ["10:00", "12:00", "14:00", "16:00"], 3: ["10:00", "12:00", "14:00", "16:00"], 4: ["10:00", "12:00", "14:00", "16:00"], 5: ["10:00", "12:00", "14:00", "16:00"], 6: ["11:00", "13:00", "15:00"], 0: [] },
    specific: {}
};

// --- ЗАВАНТАЖЕННЯ З БАЗИ ПРИ СТАРТІ ---
async function loadScheduleFromDB() {
    const { data, error } = await supabaseClient
        .from('app_settings')
        .select('*')
        .in('setting_key', ['vacations', 'weekly_schedule', 'specific_schedule']);
        
    if (data) {
        data.forEach(row => {
            if (row.setting_key === 'vacations') window.scheduleData.vacations = row.setting_value || [];
            if (row.setting_key === 'weekly_schedule') window.scheduleData.weekly = row.setting_value || window.scheduleData.weekly;
            if (row.setting_key === 'specific_schedule') window.scheduleData.specific = row.setting_value || {};
        });
    }
    
    // Оновлюємо візуал адмінки, якщо функції вже доступні
    if (typeof renderVacationTags === 'function') renderVacationTags();
    if (typeof renderTimeTags === 'function') renderTimeTags();
    if (typeof renderSpecificTimeTags === 'function') renderSpecificTimeTags();
}

// --- УНІВЕРСАЛЬНЕ ЗБЕРЕЖЕННЯ В БАЗУ ---
async function saveScheduleToDB(key, value) {
    const { error } = await supabaseClient
        .from('app_settings')
        .update({ setting_value: value })
        .eq('setting_key', key);
        
    if (error) {
        console.error("Помилка збереження графіка:", error);
        alert("❌ Помилка доступу. Ви не авторизовані!");
    } else {
        // Якщо календар відкритий, перемальовуємо його
        const calendarModal = document.getElementById("calendarModal");
        if(calendarModal && calendarModal.style.display === "flex" && typeof generateDays === 'function') {
            generateDays();
        }
    }
}

// --- 11.1 ВИХІДНІ ---
const vacationDateInput = document.getElementById("vacationDateInput");
const addVacationBtn = document.getElementById("addVacationBtn");
const vacationTagsContainer = document.getElementById("vacationTagsContainer");

function renderVacationTags() {
    if(!vacationTagsContainer) return;
    vacationTagsContainer.innerHTML = "";
    if (window.scheduleData.vacations.length === 0) {
        vacationTagsContainer.innerHTML = "<span style='color: #555;'>Немає запланованих вихідних</span>";
        return;
    }
    let sorted = [...window.scheduleData.vacations].sort();
    sorted.forEach(date => {
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
        if (!window.scheduleData.vacations.includes(selectedDate)) {
            window.scheduleData.vacations.push(selectedDate);
            saveScheduleToDB('vacations', window.scheduleData.vacations);
            renderVacationTags();
            vacationDateInput.value = ""; 
        } else {
            alert("Цей день вже відмічено як вихідний!");
        }
    });
}

window.removeVacation = function(dateToRemove) {
    window.scheduleData.vacations = window.scheduleData.vacations.filter(date => date !== dateToRemove);
    saveScheduleToDB('vacations', window.scheduleData.vacations);
    renderVacationTags();
};

// --- 11.2 ТИЖНЕВИЙ ГРАФІК ---
const dayOfWeekSelect = document.getElementById("dayOfWeekSelect");
const timeSlotInput = document.getElementById("timeSlotInput");
const addTimeSlotBtn = document.getElementById("addTimeSlotBtn");
const timeTagsContainer = document.getElementById("timeTagsContainer");

function renderTimeTags() {
    if (!timeTagsContainer || !dayOfWeekSelect) return;
    const selectedDay = dayOfWeekSelect.value;
    const times = window.scheduleData.weekly[selectedDay] || [];
    timeTagsContainer.innerHTML = "";
    if (times.length === 0) {
        timeTagsContainer.innerHTML = "<span style='color: #555;'>У цей день немає прийомів (Вихідний)</span>";
        return;
    }
    let sorted = [...times].sort();
    sorted.forEach(time => {
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
        if (!window.scheduleData.weekly[selectedDay]) window.scheduleData.weekly[selectedDay] = [];
        if (!window.scheduleData.weekly[selectedDay].includes(newTime)) {
            window.scheduleData.weekly[selectedDay].push(newTime);
            saveScheduleToDB('weekly_schedule', window.scheduleData.weekly);
            renderTimeTags();
            timeSlotInput.value = "";
        } else {
            alert("Цей час вже є у графіку на цей день!");
        }
    });
}

window.removeTimeSlot = function(day, timeToRemove) {
    window.scheduleData.weekly[day] = window.scheduleData.weekly[day].filter(time => time !== timeToRemove);
    saveScheduleToDB('weekly_schedule', window.scheduleData.weekly);
    renderTimeTags();
};

// --- 11.3 ОСОБЛИВИЙ ГРАФІК НА ДАТУ ---
const specificDateInput = document.getElementById("specificDateInput");
const specificTimeInput = document.getElementById("specificTimeInput");
const addSpecificTimeBtn = document.getElementById("addSpecificTimeBtn");
const specificTimeTagsContainer = document.getElementById("specificTimeTagsContainer");

function renderSpecificTimeTags() {
    if (!specificTimeTagsContainer || !specificDateInput) return;
    const selectedDate = specificDateInput.value;
    if (!selectedDate) {
        specificTimeTagsContainer.innerHTML = "<span style='color: #555;'>Оберіть дату, щоб побачити або змінити її години</span>";
        return;
    }
    const times = window.scheduleData.specific[selectedDate] || [];
    specificTimeTagsContainer.innerHTML = "";
    if (times.length === 0) {
        specificTimeTagsContainer.innerHTML = "<span style='color: #555;'>Немає особливих годин. Діє стандартний графік.</span>";
        return;
    }
    let sorted = [...times].sort();
    sorted.forEach(time => {
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
        if (!window.scheduleData.specific[date]) window.scheduleData.specific[date] = [];
        if (!window.scheduleData.specific[date].includes(time)) {
            window.scheduleData.specific[date].push(time);
            saveScheduleToDB('specific_schedule', window.scheduleData.specific);
            renderSpecificTimeTags();
            specificTimeInput.value = "";
        } else {
            alert("Цей час вже додано на цю дату!");
        }
    });
}

window.removeSpecificTimeSlot = function(date, timeToRemove) {
    window.scheduleData.specific[date] = window.scheduleData.specific[date].filter(time => time !== timeToRemove);
    if (window.scheduleData.specific[date].length === 0) delete window.scheduleData.specific[date]; 
    saveScheduleToDB('specific_schedule', window.scheduleData.specific);
    renderSpecificTimeTags();
};

// --- ВИКЛИК ПРИ СТАРТІ ---
loadScheduleFromDB();

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
// 14. ДИНАМІЧНІ СЕРТИФІКАТИ (SUPABASE)
// ==========================================
const certStatusNo = document.getElementById("certStatusNo");
const certStatusYes = document.getElementById("certStatusYes");
const certUploadContainer = document.getElementById("certUploadContainer");
const adminCertList = document.getElementById("adminCertList");
const certFileInputAdmin = document.getElementById("certFileInputAdmin");
const certificatesSectionClient = document.getElementById("certificatesSectionClient");
const certCarouselContainer = document.getElementById("certCarouselContainer");

// --- СТРУКТУРА ДАНИХ ---
let certData = {
    status: "yes",
    list: [
        "https://images.unsplash.com/photo-1589330694653-efa6482d8cbb?auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1574607383471-155018a1a3de?auto=format&fit=crop&q=80"
    ]
};

// --- ЗАВАНТАЖЕННЯ З БЕКЕНДУ ---
async function loadCertificates() {
    const { data, error } = await supabaseClient
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'certificates')
        .single();

    if (data && data.setting_value) {
        certData = data.setting_value;
    }
    
    renderClientCerts();
    if (document.body.classList.contains("admin-mode-active")) {
        renderAdminCerts();
    }
}

// --- ЗБЕРЕЖЕННЯ НА БЕКЕНД ---
async function saveCertificatesToDB() {
    const { error } = await supabaseClient
        .from('app_settings')
        // Використовуємо upsert, щоб створити запис, якщо його ще не було в базі
        .upsert({ setting_key: 'certificates', setting_value: certData });

    if (error) {
        console.error("Помилка збереження сертифікатів:", error);
        alert("❌ Відмова у доступі. Ви не авторизовані!");
    } else {
        renderClientCerts();
    }
}

// --- ВІДОБРАЖЕННЯ ДЛЯ КЛІЄНТА ---
function renderClientCerts() {
    if (!certificatesSectionClient || !certCarouselContainer) return;
    
    if (certData.status === "no" || certData.list.length === 0) {
        certificatesSectionClient.style.display = "none";
    } else {
        certificatesSectionClient.style.display = "block";
        certCarouselContainer.innerHTML = "";
        
        certData.list.forEach(src => {
            let img = document.createElement("img");
            img.src = src;
            img.className = "cert-img";
            img.alt = "Сертифікат";
            img.onclick = () => window.openCert(src);
            certCarouselContainer.appendChild(img);
        });
    }
}

// --- ВІДОБРАЖЕННЯ В АДМІНЦІ ---
window.renderAdminCerts = function() {
    if (certStatusNo && certStatusYes && certUploadContainer) {
        if (certData.status === "yes") {
            certStatusYes.checked = true;
            certUploadContainer.style.display = "block";
        } else {
            certStatusNo.checked = true;
            certUploadContainer.style.display = "none";
        }
    }

    if (adminCertList) {
        adminCertList.innerHTML = "";
        certData.list.forEach((src, index) => {
            let wrapper = document.createElement("div");
            wrapper.style.position = "relative";
            wrapper.style.display = "inline-block";
            
            let img = document.createElement("img");
            img.src = src;
            img.style.width = "100px"; img.style.height = "100px"; img.style.objectFit = "cover"; img.style.borderRadius = "8px"; img.style.border = "1px solid #444";
            
            let delBtn = document.createElement("button");
            delBtn.innerHTML = "❌";
            delBtn.style.position = "absolute"; delBtn.style.top = "-8px"; delBtn.style.right = "-8px";
            delBtn.style.background = "#1a1a1a"; delBtn.style.border = "1px solid #333"; delBtn.style.borderRadius = "50%"; delBtn.style.cursor = "pointer"; delBtn.style.padding = "4px";
            
            delBtn.onclick = () => {
                certData.list.splice(index, 1);
                saveCertificatesToDB();
                renderAdminCerts();
            };
            
            wrapper.appendChild(img);
            wrapper.appendChild(delBtn);
            adminCertList.appendChild(wrapper);
        });
    }
}

// --- ОБРОБНИКИ ПОДІЙ ДЛЯ АДМІНА ---
if (certStatusNo && certStatusYes) {
    certStatusNo.addEventListener("change", () => {
        certData.status = "no";
        saveCertificatesToDB();
        renderAdminCerts();
    });
    certStatusYes.addEventListener("change", () => {
        certData.status = "yes";
        saveCertificatesToDB();
        renderAdminCerts();
    });
}

if (certFileInputAdmin) {
    certFileInputAdmin.addEventListener("change", function(e) {
        // Використовуємо універсальний компресор з 15-го блоку
        compressAndSaveImage(e.target.files[0], (base64) => {
            if (certData.list.length >= 10) {
                alert("❌ Досягнуто ліміт у 10 сертифікатів. Видаліть старі.");
                return;
            }
            certData.list.push(base64);
            saveCertificatesToDB();
            renderAdminCerts();
        });
    });
}

// Запуск при старті
loadCertificates();

// ==========================================
// 15. ПРОФІЛЬ МАЙСТРА ТА ПОРТФОЛІО (SUPABASE)
// ==========================================
const clientMasterImg = document.getElementById("clientMasterImg");
const clientMasterName = document.getElementById("clientMasterName");
const clientMasterDesc = document.getElementById("clientMasterDesc");
const portfolioSectionClient = document.getElementById("portfolioSectionClient");
const portfolioCarouselContainer = document.getElementById("portfolioCarouselContainer");

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

// --- СТРУКТУРА ДАНИХ ---
let masterData = {
    name: "Ваш майстер",
    desc: "Привіт! Я — топ-майстер...",
    photo: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80",
    portfolioStatus: "no",
    portfolioList: []
};

// --- ЗАВАНТАЖЕННЯ З БЕКЕНДУ ---
async function loadMasterProfile() {
    const { data, error } = await supabaseClient
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'master_profile')
        .single();

    if (data && data.setting_value) {
        masterData = { ...masterData, ...data.setting_value };
    }
    
    renderClientMasterProfile();
    if (document.body.classList.contains("admin-mode-active")) {
        renderAdminMasterProfile();
    }
}

// --- ЗБЕРЕЖЕННЯ НА БЕКЕНД ---
async function saveMasterProfileToDB() {
    const { error } = await supabaseClient
        .from('app_settings')
        .update({ setting_value: masterData })
        .eq('setting_key', 'master_profile');

    if (error) {
        console.error("Помилка збереження профілю:", error);
        alert("❌ Відмова у доступі. Ви не авторизовані!");
    } else {
        renderClientMasterProfile();
    }
}

// --- ВІДОБРАЖЕННЯ ДЛЯ КЛІЄНТА ---
function renderClientMasterProfile() {
    if (clientMasterName) clientMasterName.innerText = masterData.name;
    if (clientMasterDesc) clientMasterDesc.innerText = masterData.desc;
    if (clientMasterImg) clientMasterImg.src = masterData.photo;

    if (portfolioSectionClient && portfolioCarouselContainer) {
        if (masterData.portfolioStatus === "no" || masterData.portfolioList.length === 0) {
            portfolioSectionClient.style.display = "none";
        } else {
            portfolioSectionClient.style.display = "block";
            portfolioCarouselContainer.innerHTML = "";
            masterData.portfolioList.forEach(src => {
                let img = document.createElement("img");
                img.src = src;
                img.className = "cert-img";
                img.onclick = () => window.openCert(src); 
                portfolioCarouselContainer.appendChild(img);
            });
        }
    }
}

// --- ВІДОБРАЖЕННЯ В АДМІНЦІ ---
window.renderAdminMasterProfile = function() {
    if (adminMasterNameInput) adminMasterNameInput.value = masterData.name;
    if (adminMasterDescInput) adminMasterDescInput.value = masterData.desc;
    if (adminMasterPhotoPreview) adminMasterPhotoPreview.src = masterData.photo;

    if (portfolioStatusNo && portfolioStatusYes && portfolioUploadContainer) {
        if (masterData.portfolioStatus === "yes") {
            portfolioStatusYes.checked = true;
            portfolioUploadContainer.style.display = "block";
        } else {
            portfolioStatusNo.checked = true;
            portfolioUploadContainer.style.display = "none";
        }
    }

    if (adminPortfolioList) {
        adminPortfolioList.innerHTML = "";
        masterData.portfolioList.forEach((src, index) => {
            let wrapper = document.createElement("div");
            wrapper.style.position = "relative";
            wrapper.style.display = "inline-block";
            
            let img = document.createElement("img");
            img.src = src;
            img.style.width = "100px"; img.style.height = "100px"; img.style.objectFit = "cover"; img.style.borderRadius = "8px";
            
            let delBtn = document.createElement("button");
            delBtn.innerHTML = "❌";
            delBtn.style.position = "absolute"; delBtn.style.top = "-8px"; delBtn.style.right = "-8px";
            delBtn.style.background = "#1a1a1a"; delBtn.style.border = "1px solid #333"; delBtn.style.borderRadius = "50%"; delBtn.style.cursor = "pointer"; delBtn.style.padding = "4px";
            
            delBtn.onclick = () => {
                masterData.portfolioList.splice(index, 1);
                saveMasterProfileToDB();
                renderAdminMasterProfile();
            };
            
            wrapper.appendChild(img);
            wrapper.appendChild(delBtn);
            adminPortfolioList.appendChild(wrapper);
        });
    }
}

// --- ОБРОБНИКИ ПОДІЙ ДЛЯ АДМІНА ---
if (saveMasterInfoBtn) {
    saveMasterInfoBtn.addEventListener("click", () => {
        masterData.name = adminMasterNameInput.value.trim() || "Ваш майстер";
        masterData.desc = adminMasterDescInput.value.trim() || "";
        saveMasterProfileToDB();
        alert("✅ Дані майстра успішно збережено на сервері!");
    });
}

if (masterPhotoUpload) {
    masterPhotoUpload.addEventListener("change", function(e) {
        compressAndSaveImage(e.target.files[0], (base64) => {
            masterData.photo = base64;
            saveMasterProfileToDB();
            renderAdminMasterProfile();
        });
    });
}

if (portfolioStatusNo && portfolioStatusYes) {
    portfolioStatusNo.addEventListener("change", () => {
        masterData.portfolioStatus = "no";
        saveMasterProfileToDB();
        renderAdminMasterProfile();
    });
    portfolioStatusYes.addEventListener("change", () => {
        masterData.portfolioStatus = "yes";
        saveMasterProfileToDB();
        renderAdminMasterProfile();
    });
}

if (portfolioFileInput) {
    portfolioFileInput.addEventListener("change", function(e) {
        compressAndSaveImage(e.target.files[0], (base64) => {
            // Щоб уникнути перевищення ліміту колонки JSONB, обмежуємо масив до 10 фото
            if (masterData.portfolioList.length >= 10) {
                alert("❌ Досягнуто ліміт у 10 фото для портфоліо. Видаліть старі.");
                return;
            }
            masterData.portfolioList.push(base64);
            saveMasterProfileToDB();
            renderAdminMasterProfile();
        });
    });
}

// --- УНІВЕРСАЛЬНИЙ КОМПРЕСОР ФОТО ---
function compressAndSaveImage(file, callback) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const MAX_WIDTH = 600; // Жорстко ріжемо ширину для JSONB
            let width = img.width; let height = img.height;
            if (width > MAX_WIDTH) {
                height = Math.round((height * MAX_WIDTH) / width);
                width = MAX_WIDTH;
            }
            canvas.width = width; canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            // Сильне стиснення (0.6), щоб база даних не захлинулася від Base64
            const base64Image = canvas.toDataURL("image/jpeg", 0.6);
            callback(base64Image);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// Запуск при старті
loadMasterProfile();
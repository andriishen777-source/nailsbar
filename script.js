// Створюємо "спостерігача"
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        // Якщо елемент з'явився в зоні видимості екрану
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
        }
    });
});

// Знаходимо всі елементи з класом .hidden
const hiddenElements = document.querySelectorAll('.hidden');

// Вішаємо на них спостерігача
hiddenElements.forEach((el) => observer.observe(el));
// --- ЛОГІКА МОДАЛЬНОГО ВІКНА ---
const modal = document.getElementById("bookingModal");
// Шукаємо всі кнопки на сайті, які мають відкривати запис (навігація + головний екран)
const openBtns = document.querySelectorAll(".nav-btn, .cta-btn:not(.submit-btn)");
const closeBtn = document.querySelector(".close-btn");

// Відкрити модалку при кліку на будь-яку кнопку запису
openBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        modal.style.display = "flex"; // Використовуємо flex для центрування
    });
});

// Закрити модалку при кліку на хрестик
closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
});

// Закрити модалку при кліку мишкою повз вікно (по темному фону)
window.addEventListener("click", (event) => {
    if (event.target === modal) {
        modal.style.display = "none";
    }
});

// --- ІНІЦІАЛІЗАЦІЯ БАЗИ ДАНИХ SUPABASE ---
const supabaseUrl = 'https://bgmrbujrxdyhdrngcevx.supabase.co'; 
const supabaseKey = 'sb_publishable_t7QyH8dHNBBbFQGY_62oRA_CaA5vXa_'; 
// Змінили назву на supabaseClient, щоб не було конфлікту!
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// --- ЛОГІКА ВІДПРАВКИ ЗАПИСУ В БАЗУ ---
document.getElementById("bookingForm").addEventListener("submit", async function(e) {
    e.preventDefault(); 
    
    // 1. Збираємо дані з полів
    const name = document.getElementById("clientName").value.trim();
    const phone = document.getElementById("clientPhone").value.trim();
    const dateTime = document.getElementById("selectedDateTime").value;
    const comment = document.getElementById("clientComment").value.trim();
    
    // 2. Збираємо вибрані послуги (галочки)
    const selectedServices = [];
    document.querySelectorAll('.modal-service-cb:checked').forEach(cb => {
        selectedServices.push(cb.value);
    });

    // Перевірки, щоб клієнтка не відправила порожню форму
    if (selectedServices.length === 0) {
        alert("Будь ласка, оберіть хоча б одну послугу!");
        return;
    }
    if (!dateTime) {
        alert("Будь ласка, оберіть дату та час!");
        return;
    }

    // 3. Робимо кнопку "Завантаженням"
    const submitBtn = document.querySelector("#bookingForm .submit-btn");
    const originalText = submitBtn.innerText;
    submitBtn.innerText = "Відправляємо... ⏳";
    submitBtn.disabled = true;

    // 4. ВІДПРАВКА В SUPABASE (використовуємо нову назву supabaseClient)
    const { data, error } = await supabaseClient
        .from('bookings')
        .insert([
            { 
                client_name: name, 
                client_phone: phone, 
                services: selectedServices.join(' | '),
                booking_date: dateTime,
                comment: comment
            }
        ]);

    // 5. Повертаємо кнопку в норму
    submitBtn.innerText = originalText;
    submitBtn.disabled = false;

    // 6. Реакція на результат
    if (error) {
        console.error("Помилка Supabase:", error);
        alert("Ой, сталась помилка при записі 😔 Спробуйте ще раз.");
    } else {
        // Успіх!
        alert("✅ Ваш запис успішно підтверджено! Чекаємо на вас.");
        
        // Очищаємо і закриваємо форму
        document.getElementById("bookingModal").style.display = "none";
        document.getElementById("bookingForm").reset();
        
        // Скидаємо кнопку календаря
        const calendarBtn = document.getElementById("openCalendarBtn");
        calendarBtn.innerText = "📅 Оберіть дату та час";
        calendarBtn.style.color = "#aaa";
        document.getElementById("selectedDateTime").value = "";
    }
});
// --- ЛОГІКА КАЛЕНДАРЯ ---
const calendarModal = document.getElementById("calendarModal");
const openCalendarBtn = document.getElementById("openCalendarBtn");
const closeCalendarBtn = document.querySelector(".close-calendar-btn");
const calendarDays = document.getElementById("calendarDays");
const timeSlotsTitle = document.getElementById("timeSlotsTitle");
const timeSlots = document.getElementById("timeSlots");
const selectedDateTimeInput = document.getElementById("selectedDateTime");
const toast = document.getElementById("toast");

let selectedDate = null;

// Відкриваємо календар
if (openCalendarBtn && calendarModal) {
    openCalendarBtn.addEventListener("click", () => {
        calendarModal.style.display = "flex";
        generateDays(); 
    });
} else {
    console.log("Помилка: Не знайдено кнопку openCalendarBtn або вікно calendarModal");
}

// Закриваємо календар на хрестик
if (closeCalendarBtn) {
    closeCalendarBtn.addEventListener("click", () => {
        calendarModal.style.display = "none";
    });
}

// Закриваємо календар, якщо клікнути повз нього (по темному фону)
window.addEventListener("click", (event) => {
    if (event.target === calendarModal) {
        calendarModal.style.display = "none";
    }
});

// Генерація днів
// --- ЛОГІКА ДИНАМІЧНОГО КАЛЕНДАРЯ ---
let navDate = new Date(); // Змінна, яка пам'ятає, який місяць ми зараз дивимось

const prevMonthBtn = document.getElementById("prevMonthBtn");
const nextMonthBtn = document.getElementById("nextMonthBtn");

// Функція генерації календаря для вибраного місяця
function generateDays() {
    calendarDays.innerHTML = "";
    timeSlots.style.display = "none";
    timeSlotsTitle.style.display = "none";
    
    const today = new Date();
    const year = navDate.getFullYear();
    const monthIndex = navDate.getMonth(); 

    const monthNames = ["Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень", "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"];
    
    document.getElementById("currentMonthYear").innerText = `${monthNames[monthIndex]} ${year}`;

    // Перевірка: чи дивимось ми поточний місяць реального часу?
    const isCurrentMonth = (year === today.getFullYear() && monthIndex === today.getMonth());
    
    // Блокуємо кнопку "Назад", якщо це поточний місяць
    if (isCurrentMonth) {
        prevMonthBtn.classList.add("disabled");
    } else {
        prevMonthBtn.classList.remove("disabled");
    }

    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    // Демо-дані графіку
    const vacationDays = [18, 19, 20]; 
    const fullyBookedDays = [10, 15];  

    for (let i = 1; i <= daysInMonth; i++) {
        let dayBtn = document.createElement("div");
        dayBtn.classList.add("day-box");
        dayBtn.innerText = i;
        
        // Блокуємо дні, які вже минули (тільки якщо це поточний місяць)
        if (isCurrentMonth && i < today.getDate()) {
            dayBtn.classList.add("disabled");
        } else if (vacationDays.includes(i) || fullyBookedDays.includes(i)) {
            dayBtn.classList.add("disabled");
            dayBtn.addEventListener("click", () => showToast("Цей день зайнятий або вихідний!"));
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

// Кліки по стрілочках місяця
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

// --- ІНТЕГРАЦІЯ ПРАЙСУ ТА ФОРМИ ЗАПИСУ ---
const priceItems = document.querySelectorAll(".price-item");
const modalServiceCheckboxes = document.querySelectorAll(".modal-service-cb");

priceItems.forEach(item => {
    item.addEventListener("click", () => {
        // Отримуємо назву послуги, на яку клікнули
        const clickedServiceName = item.querySelector(".price-name").innerText.trim();
        
        // Відкриваємо модалку запису
        const bookingModal = document.getElementById("bookingModal");
        if(bookingModal) bookingModal.style.display = "flex";

        // Ставимо галочку навпроти відповідної послуги у віконці
        modalServiceCheckboxes.forEach(cb => {
            // Шукаємо, чи текст чекбокса містить частину назви з прайсу
            if (clickedServiceName.includes(cb.value) || cb.value.includes(clickedServiceName)) {
                cb.checked = true;
            } else {
                cb.checked = false; // Знімаємо галочки з інших
            }
        });
    });
});
// Генерація годин
function showTimeSlots() {
    timeSlots.innerHTML = "";
    timeSlotsTitle.style.display = "block";
    timeSlots.style.display = "grid";

    const hours = [
        { time: "10:00", booked: false },
        { time: "11:30", booked: true }, 
        { time: "13:00", booked: false },
        { time: "14:30", booked: true }, 
        { time: "16:00", booked: false },
        { time: "17:30", booked: false }
    ];

    hours.forEach(slot => {
        let timeBtn = document.createElement("div");
        timeBtn.classList.add("time-box");
        timeBtn.innerText = slot.time;

        if (slot.booked) {
            timeBtn.classList.add("booked");
            timeBtn.addEventListener("click", () => showToast());
        } else {
            timeBtn.classList.add("available");
            timeBtn.addEventListener("click", () => {
                let finalSelection = `${selectedDate}, ${slot.time}`;
                openCalendarBtn.innerText = `📅 ${finalSelection}`;
                openCalendarBtn.style.color = "white";
                selectedDateTimeInput.value = finalSelection; // Записуємо у прихований інпут для бази даних
                calendarModal.style.display = "none";
            });
        }
        
        timeSlots.appendChild(timeBtn);
    });
}

// Сповіщення
function showToast() {
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}
// --- ЛОГІКА КАРУСЕЛІ ВІДГУКІВ ---
const reviewsModal = document.getElementById("reviewsModal");
const openReviewsBtn = document.getElementById("openReviewsBtn");
const closeReviewsBtn = document.querySelector(".close-reviews-btn");
const carouselImage = document.getElementById("carouselImage");
const prevBtn = document.querySelector(".prev-btn");
const nextBtn = document.querySelector(".next-btn");
const carouselCounter = document.getElementById("carouselCounter");

// Демо-масив з фотографіями (у майбутньому вони будуть тягнутися з Supabase)
const reviewImages = [
    "https://images.unsplash.com/photo-1516975080661-46bfa33633ab?auto=format&fit=crop&q=80", 
    "https://images.unsplash.com/photo-1519014816548-bf5fe059e98b?auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80"
];
let currentReviewIndex = 0;

// Функція оновлення картинки
function updateCarousel() {
    carouselImage.src = reviewImages[currentReviewIndex];
    carouselCounter.innerText = `${currentReviewIndex + 1} / ${reviewImages.length}`;
}

// Відкриття каруселі
if (openReviewsBtn && reviewsModal) {
    openReviewsBtn.addEventListener("click", () => {
        currentReviewIndex = 0; // Завжди починаємо з першого відгуку
        updateCarousel();
        reviewsModal.style.display = "flex";
    });
}

// Закриття каруселі
if (closeReviewsBtn) {
    closeReviewsBtn.addEventListener("click", () => {
        reviewsModal.style.display = "none";
    });
}
window.addEventListener("click", (event) => {
    if (event.target === reviewsModal) {
        reviewsModal.style.display = "none";
    }
});

// Кнопка Вперед
nextBtn.addEventListener("click", () => {
    // Якщо дійшли до кінця - перекидаємо на початок
    currentReviewIndex = (currentReviewIndex + 1) % reviewImages.length;
    updateCarousel();
});

// Кнопка Назад
prevBtn.addEventListener("click", () => {
    // Якщо дійшли до початку - перекидаємо в кінець
    currentReviewIndex = (currentReviewIndex - 1 + reviewImages.length) % reviewImages.length;
    updateCarousel();
});
// --- ЛОГІКА СЕРТИФІКАТІВ ---
const certModal = document.getElementById("certModal");
const fullCertImage = document.getElementById("fullCertImage");
const closeCertBtn = document.querySelector(".close-cert-btn");

// Ця функція викликається прямо з HTML (onclick)
window.openCert = function(imageSrc) {
    fullCertImage.src = imageSrc;
    certModal.style.display = "flex";
};

// Закриваємо модалку сертифіката
if (closeCertBtn) {
    closeCertBtn.addEventListener("click", () => {
        certModal.style.display = "none";
    });
}

// Закриття по кліку на темний фон
window.addEventListener("click", (event) => {
    if (event.target === certModal) {
        certModal.style.display = "none";
    }
});
// --- ЛОГІКА ПЕРЕВІРКИ ЗАПИСУ ТА АДМІН-ПАНЕЛІ ---
const checkBookingModal = document.getElementById("checkBookingModal");
const openCheckModalBtn = document.getElementById("openCheckModalBtn");
const closeCheckBtn = document.querySelector(".close-check-btn");
const verifyPhoneBtn = document.getElementById("verifyPhoneBtn");
const checkPhoneInput = document.getElementById("checkPhoneInput");

const checkPhoneSection = document.getElementById("checkPhoneSection");
const adminLoginSection = document.getElementById("adminLoginSection");
const checkResultSection = document.getElementById("checkResultSection");
const goToBookingBtn = document.getElementById("goToBookingBtn");

// Відкрити вікно перевірки
if (openCheckModalBtn) {
    openCheckModalBtn.addEventListener("click", () => {
        // Скидаємо вікно до початкового стану
        checkPhoneSection.style.display = "block";
        adminLoginSection.style.display = "none";
        checkResultSection.style.display = "none";
        checkPhoneInput.value = "";
        
        checkBookingModal.style.display = "flex";
    });
}

// Закрити вікно перевірки
if (closeCheckBtn) {
    closeCheckBtn.addEventListener("click", () => {
        checkBookingModal.style.display = "none";
    });
}

// Логіка кнопки "Знайти запис"
verifyPhoneBtn.addEventListener("click", () => {
    const phone = checkPhoneInput.value.replace(/\D/g, ''); // Залишаємо тільки цифри
    
    checkPhoneSection.style.display = "none"; // Ховаємо поле вводу телефону

    // ТУТ БУДЕ ЗАПИТ ДО SUPABASE. 
    // Поки що робимо перевірку: якщо номер адмінський
    if (phone === "0680011001") {
        adminLoginSection.style.display = "block"; // Показуємо поле для пароля
    } else {
        // Якщо звичайний клієнт (імпровізація, що запису нема)
        checkResultSection.style.display = "block";
    }
});

// Кнопка "Записатися зараз" (з вікна помилки)
goToBookingBtn.addEventListener("click", () => {
    checkBookingModal.style.display = "none";
    document.getElementById("bookingModal").style.display = "flex"; // Відкриваємо форму запису
});
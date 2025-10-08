// Dữ liệu lịch học mẫu từ hình ảnh mới
let scheduleData = [
    { time: "7h", mon: "Đại số tuyến tính", tue: "Giải tích 1", wed: "", thu: "", fri: "", sat: "" },
    { time: "8h", mon: "Đại số tuyến tính", tue: "Giải tích 1", wed: "", thu: "", fri: "", sat: "" },
    { time: "9h", mon: "Đại số tuyến tính", tue: "Giải tích 1", wed: "", thu: "", fri: "", sat: "" },
    { time: "13h", mon: "", tue: "", wed: "", thu: "Tin Đại Cương", fri: "Triết học", sat: "" },
    { time: "13h55", mon: "", tue: "", wed: "Thể Dục", thu: "Tin Đại Cương", fri: "Triết học", sat: "" },
    { time: "14h55", mon: "", tue: "", wed: "Thể Dục", thu: "Tin Đại Cương", fri: "Triết học", sat: "" },
    { time: "15h50", mon: "", tue: "", wed: "Thể Dục", thu: "Tin Đại Cương", fri: "Triết học", sat: "" },
    { time: "16h45", mon: "", tue: "", wed: "Thể Dục", thu: "Tin Đại Cương", fri: "Triết học", sat: "" }
];

// Ánh xạ thời gian (time) sang định dạng HHMMSS để tính toán cho iCal
// Mỗi tiết học kéo dài 45 phút
const timeToHHMMSS = {
    "7h": "070000",
    "8h": "080000",
    "9h": "090000",
    "13h": "130000",
    "13h55": "135500",
    "14h55": "145500",
    "15h50": "155000",
    "16h45": "164500"
};

// Ánh xạ tên ngày sang mã iCal
const dayMapping = {
    "Mon": "MO",
    "Tue": "TU",
    "Wed": "WE",
    "Thu": "TH",
    "Fri": "FR",
    "Sat": "SA"
};

// Ánh xạ tên ngày sang số thứ tự trong tuần (để tính toán ngày bắt đầu sự kiện)
// (0=CN, 1=T2, 2=T3...)
const dayNameToIndex = {
    "Mon": 1,
    "Tue": 2,
    "Wed": 3,
    "Thu": 4,
    "Fri": 5,
    "Sat": 6
};

const tableBody = document.querySelector('#scheduleTable tbody');
const showAddFormBtn = document.getElementById('showAddFormBtn');
const addFormContainer = document.getElementById('addFormContainer');
const addScheduleForm = document.getElementById('addScheduleForm');
const cancelAddBtn = document.getElementById('cancelAddBtn');
const exportCalendarBtn = document.getElementById('exportCalendarBtn');

// Hàm tính giờ kết thúc (45 phút sau giờ bắt đầu)
const getEndTime = (startTimeHHMMSS) => {
    if (!startTimeHHMMSS) return null;

    const hour = parseInt(startTimeHHMMSS.substring(0, 2));
    const minute = parseInt(startTimeHHMMSS.substring(2, 4));
    
    const totalMinutes = minute + 45; // 45 phút cho mỗi tiết
    let newHour = hour + Math.floor(totalMinutes / 60);
    const finalMinute = totalMinutes % 60;
    
    return `${String(newHour).padStart(2, '0')}${String(finalMinute).padStart(2, '0')}00`;
};

// Hàm xử lý ký tự đặc biệt trong iCal
const escapeIcsValue = (value) => {
    if (!value) return '';
    return value.toString().replace(/\\/g, '\\\\')
                .replace(/;/g, '\\;')
                .replace(/,/g, '\\,')
                .replace(/\n/g, '\\n');
};

// Hàm render lại bảng
const renderTable = () => {
    tableBody.innerHTML = ''; 

    // Lấy tất cả các giờ học duy nhất và sắp xếp chúng
    const allTimes = [...new Set(scheduleData.map(item => item.time))].sort((a, b) => {
        const timeA = parseInt(timeToHHMMSS[a]);
        const timeB = parseInt(timeToHHMMSS[b]);
        return timeA - timeB;
    });

    // Tạo một map để dễ dàng tìm dữ liệu theo giờ và thứ
    const scheduleMap = new Map(); // key: `${time}-${day}`, value: môn học
    scheduleData.forEach(item => {
        for (const day of ["mon", "tue", "wed", "thu", "fri", "sat"]) {
            if (item[day]) {
                scheduleMap.set(`${item.time}-${day}`, item[day]);
            }
        }
    });

    allTimes.forEach(time => {
        const row = document.createElement('tr');
        let rowContent = `<td>${time}</td>`;
        const days = ["mon", "tue", "wed", "thu", "fri", "sat"];
        
        days.forEach(day => {
            const subjectContent = scheduleMap.get(`${time}-${day}`) || '';
            let displayContent = subjectContent;
            
            // Nếu có thêm thông tin GV/Phòng/Tuần, chúng ta cần phân tích nó
            // Hiện tại, dữ liệu mẫu không có, nên chỉ hiển thị tên môn
            // Nếu bạn muốn hiển thị chi tiết, dữ liệu mẫu cần có cấu trúc rõ ràng hơn
            rowContent += `<td>${displayContent ? `<span class="subject">${displayContent}</span>` : ''}</td>`;
        });
        row.innerHTML = rowContent;
        tableBody.appendChild(row);
    });
};

// Hàm tạo nội dung iCal
const createIcsContent = () => {
    let ics = "BEGIN:VCALENDAR\n";
    ics += "VERSION:2.0\n";
    ics += "PRODID:-//HocKy//LichHocCuaToi//VI\n";

    // **THAY ĐỔI NGÀY NÀY** thành Thứ Hai của tuần đầu tiên của lịch học
    const startDate = new Date('2025-09-15'); // 15/09/2025 là Thứ 2

    // Duyệt qua dữ liệu scheduleData để tạo sự kiện
    scheduleData.forEach(rowItem => {
        for (const dayKey of ["mon", "tue", "wed", "thu", "fri", "sat"]) {
            const monHoc = rowItem[dayKey];
            if (!monHoc) continue; // Bỏ qua nếu không có môn học vào giờ này

            const dayName = dayKey.charAt(0).toUpperCase() + dayKey.slice(1); // Mon, Tue...
            const iCalDay = dayMapping[dayName];
            const dayIndex = dayNameToIndex[dayName];
            
            const startTimeHHMMSS = timeToHHMMSS[rowItem.time];
            const endTimeHHMMSS = getEndTime(startTimeHHMMSS); 
            
            if (!startTimeHHMMSS || !endTimeHHMMSS) continue; 

            // Tính toán ngày chính xác cho sự kiện lặp lại đầu tiên
            const eventStartDate = new Date(startDate);
            eventStartDate.setDate(startDate.getDate() + (dayIndex - eventStartDate.getDay() + 7) % 7);
            
            const dtStart = eventStartDate.toISOString().slice(0, 10).replace(/-/g, '') + 'T' + startTimeHHMMSS;
            const dtEnd = eventStartDate.toISOString().slice(0, 10).replace(/-/g, '') + 'T' + endTimeHHMMSS;
            const uid = Date.now() + '-' + dayKey + '-' + rowItem.time + Math.random();
            
            ics += "BEGIN:VEVENT\n";
            ics += `UID:${uid}\n`;
            ics += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z\n`;
            ics += `SUMMARY:${escapeIcsValue(monHoc)}\n`; // Chỉ có tên môn học
            // Không có thông tin phòng, GV, loại giờ trong dữ liệu mẫu mới
            ics += `LOCATION:${escapeIcsValue('Trường học')}\n`; 
            ics += `DESCRIPTION:${escapeIcsValue('Thời khóa biểu')}\\nGiờ: ${rowItem.time}\n`;
            
            // Lặp lại 15 tuần
            ics += `RRULE:FREQ=WEEKLY;BYDAY=${iCalDay};COUNT=15\n`; 
            
            ics += `DTSTART;TZID=Asia/Ho_Chi_Minh:${dtStart}\n`; 
            ics += `DTEND;TZID=Asia/Ho_Chi_Minh:${dtEnd}\n`;
            ics += "END:VEVENT\n";
        }
    });

    ics += "END:VCALENDAR\n";
    return ics;
};


// === XỬ LÝ SỰ KIỆN ===

// 1. Logic Form Thêm Mới
showAddFormBtn.addEventListener('click', () => {
    addFormContainer.classList.remove('hidden');
    showAddFormBtn.style.display = 'none';
    exportCalendarBtn.style.display = 'none';
});

cancelAddBtn.addEventListener('click', () => {
    addFormContainer.classList.add('hidden');
    showAddFormBtn.style.display = 'inline-block';
    exportCalendarBtn.style.display = 'inline-block';
    addScheduleForm.reset();
});

addScheduleForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const tenMon = document.getElementById('tenMon').value;
    const tiet = document.getElementById('tiet').value;
    const thu = document.getElementById('thu').value; // Mon, Tue...
    const phongHoc = document.getElementById('phongHoc').value;
    const giaoVien = document.getElementById('giaoVien').value;
    const tuanHoc = document.getElementById('tuanHoc').value;

    // Tìm hoặc tạo dòng thời gian nếu chưa có
    let existingRow = scheduleData.find(item => item.time === tiet);
    if (!existingRow) {
        existingRow = { time: tiet, mon: "", tue: "", wed: "", thu: "", fri: "", sat: "" };
        scheduleData.push(existingRow);
        // Cập nhật timeToHHMMSS nếu giờ mới không có sẵn
        if (!timeToHHMMSS[tiet]) {
            // Đây là một giả định, bạn cần xác định giờ chính xác nếu người dùng nhập giờ mới
            // Ví dụ: nếu nhập "10h30", bạn có thể cần hàm để chuyển đổi "10h30" -> "103000"
            alert("Lưu ý: Giờ mới nhập có thể không tương thích với iCal nếu không đúng định dạng mẫu (vd: 7h, 13h55).");
            timeToHHMMSS[tiet] = prompt(`Nhập giờ bắt đầu HHMMSS cho "${tiet}" (ví dụ 103000):`);
            if (!timeToHHMMSS[tiet] || timeToHHMMSS[tiet].length !== 6) {
                alert("Giờ không hợp lệ, không thể thêm.");
                return;
            }
        }
    }
    
    // Gán môn học vào đúng thứ
    const dayKey = thu.toLowerCase(); // mon, tue...
    let subjectDetail = tenMon;
    if (phongHoc) subjectDetail += ` (${phongHoc})`;
    if (giaoVien) subjectDetail += ` - GV: ${giaoVien}`;
    if (tuanHoc) subjectDetail += ` - Tuần: ${tuanHoc}`;

    existingRow[dayKey] = subjectDetail;

    addFormContainer.classList.add('hidden');
    showAddFormBtn.style.display = 'inline-block';
    exportCalendarBtn.style.display = 'inline-block';
    addScheduleForm.reset();

    renderTable();
    alert(`Đã thêm môn học: ${tenMon} vào ${tiet}, ${thu}!`);
});

// 2. Logic Xuất Lịch (iCal)
exportCalendarBtn.addEventListener('click', () => {
    const icsContent = createIcsContent();
    const filename = 'School_Timetable.ics';
    
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url); 
    
    alert("File lịch học (.ics) đã được tải xuống! Vui lòng mở file này.");
});

// Khởi tạo bảng lần đầu
renderTable();
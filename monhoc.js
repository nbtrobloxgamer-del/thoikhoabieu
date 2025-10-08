// Dữ liệu lịch học ban đầu (có thể thay đổi)
let scheduleData = [
    {tt: 1, maMH: "25010704", tenMon: "Đồ họa kỹ thuật", loaiGio: "LT", nhom: "", tiet: "6-10", thu: "2", giaoVien: "Phạm Thị Kiều Diễm", phongHoc: "409B", tuanHoc: "123"},
    {tt: 2, maMH: "25010704", tenMon: "Đồ họa kỹ thuật", loaiGio: "TH", nhom: "", tiet: "1-4", thu: "2", giaoVien: "Phạm Thị Kiều Diễm", phongHoc: "203B", tuanHoc: "45_89_"},
    {tt: 3, maMH: "25010004", tenMon: "Giáo dục quốc phòng - An ninh", loaiGio: "TH", nhom: "", tiet: "1-4", thu: "2", giaoVien: "", phongHoc: "203B", tuanHoc: "67"},
    {tt: 4, maMH: "25010005", tenMon: "Tin học", loaiGio: "LT", nhom: "", tiet: "6-10", thu: "2", giaoVien: "Hà Đỗ Hồng Phúc", phongHoc: "502B", tuanHoc: "56"},
    {tt: 5, maMH: "25010005", tenMon: "Tin học", loaiGio: "TH", nhom: "", tiet: "6-9", thu: "2", giaoVien: "Hà Đỗ Hồng Phúc", phongHoc: "502B", tuanHoc: "8901"},
    {tt: 6, maMH: "25010703", tenMon: "Vẽ kỹ thuật", loaiGio: "LT", nhom: "", tiet: "1-5", thu: "3", giaoVien: "Phan Thị Hiền", phongHoc: "407B", tuanHoc: "09012345_9801"},
    {tt: 7, maMH: "25010005", tenMon: "Tin học", loaiGio: "TH", nhom: "", tiet: "1-4", thu: "4", giaoVien: "Hà Đỗ Hồng Phúc", phongHoc: "502B", tuanHoc: "56"},
    {tt: 8, maMH: "25010005", tenMon: "Tin học", loaiGio: "LT", nhom: "", tiet: "1-5", thu: "5", giaoVien: "Hà Đỗ Hồng Phúc", phongHoc: "502B", tuanHoc: "7"},
    {tt: 9, maMH: "25010005", tenMon: "Tin học", loaiGio: "TH", nhom: "", tiet: "1-4", thu: "5", giaoVien: "Hà Đỗ Hồng Phúc", phongHoc: "502B", tuanHoc: "890"},
    {tt: 10, maMH: "25010007", tenMon: "Kỹ năng mềm", loaiGio: "LT", nhom: "", tiet: "1-5", thu: "6", giaoVien: "Lê Văn Hải", phongHoc: "NTD1", tuanHoc: "090123"},
    {tt: 11, maMH: "25010006", tenMon: "Tiếng Anh", loaiGio: "LT", nhom: "", tiet: "1-5", thu: "7", giaoVien: "Nguyễn Thị Mỹ Hằng", phongHoc: "309B", tuanHoc: "09012345_9801"},
    {tt: 12, maMH: "25010006", tenMon: "Tin học", loaiGio: "TH", nhom: "", tiet: "6-9", thu: "7", giaoVien: "", phongHoc: "", tuanHoc: "12345"},
    {tt: 13, maMH: "25010006", tenMon: "Tiếng Anh", loaiGio: "LT", nhom: "", tiet: "1-5", thu: "8", giaoVien: "Nguyễn Thị Mỹ Hằng", phongHoc: "109B", tuanHoc: "5678902345"}
];

// Khung giờ bắt đầu của các tiết học (45 phút/tiết)
// **BẠN CẦN KIỂM TRA VÀ CHỈNH SỬA THỜI GIAN NÀY**
const timeMapping = {
    '1': '070000', '2': '074500', '3': '083000',
    '4': '092500', '5': '101000', '6': '105500', 
    '7': '130000', '8': '134500', '9': '143000',
    '10': '152500', '11': '161000', '12': '165500'
};

const dayMapping = {
    '2': 'MO', '3': 'TU', '4': 'WE', '5': 'TH', 
    '6': 'FR', '7': 'SA', '8': 'SU'
};

const tableBody = document.querySelector('#scheduleTable tbody');
const showAddFormBtn = document.getElementById('showAddFormBtn');
const addFormContainer = document.getElementById('addFormContainer');
const addScheduleForm = document.getElementById('addScheduleForm');
const cancelAddBtn = document.getElementById('cancelAddBtn');
const exportCalendarBtn = document.getElementById('exportCalendarBtn');

// Hàm tính giờ kết thúc (45 phút sau giờ bắt đầu của tiết cuối cùng)
const getEndTime = (tietKetThuc) => {
    const startTimeOfEndLesson = timeMapping[tietKetThuc];
    if (!startTimeOfEndLesson) return null;

    const hour = parseInt(startTimeOfEndLesson.substring(0, 2));
    const minute = parseInt(startTimeOfEndLesson.substring(2, 4));
    
    const totalMinutes = minute + 45;
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

    // Sắp xếp lại dữ liệu theo Thứ và Tiết
    scheduleData.sort((a, b) => {
        if (a.thu !== b.thu) {
            return parseInt(a.thu) - parseInt(b.thu);
        }
        const tietA = parseInt(a.tiet.split('-')[0]);
        const tietB = parseInt(b.tiet.split('-')[0]);
        return tietA - tietB;
    });

    scheduleData.forEach((item, index) => {
        item.tt = index + 1; 
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${item.tt}</td>
            <td>${item.maMH || ''}</td>
            <td class="subject-name">${item.tenMon}</td>
            <td>${item.loaiGio || ''}</td>
            <td>${item.nhom || ''}</td>
            <td>${item.tiet}</td>
            <td>${item.thu}</td>
            <td class="teacher-name">${item.giaoVien || ''}</td>
            <td class="room-info">${item.phongHoc || ''}</td>
            <td>${item.tuanHoc || ''}</td>
        `;
        
        tableBody.appendChild(row);
    });
};

// Hàm tạo nội dung iCal
const createIcsContent = () => {
    let ics = "BEGIN:VCALENDAR\n";
    ics += "VERSION:2.0\n";
    ics += "PRODID:-//HocKy//LichHocCuaToi//VI\n";

    // **THAY ĐỔI NGÀY NÀY** thành Thứ Hai đầu tiên của học kỳ của bạn!
    const startDate = new Date('2025-10-06'); // Ví dụ: 06/10/2025 là Thứ 2

    scheduleData.forEach(monHoc => {
        if (!monHoc.tiet || !monHoc.thu || !dayMapping[monHoc.thu]) return;

        const tietBatDau = monHoc.tiet.split('-')[0];
        const tietKetThuc = monHoc.tiet.split('-').pop();
        
        const startTime = timeMapping[tietBatDau];
        const endTime = getEndTime(tietKetThuc); 
        
        if (!startTime || !endTime) return; 

        // Tính toán ngày đầu tiên của môn học
        const dayOfWeek = parseInt(monHoc.thu); // 2=Thứ 2...
        const startDay = new Date(startDate);
        // Điều chỉnh ngày của startDay đến Thứ mong muốn
        startDay.setDate(startDate.getDate() + (dayOfWeek - 1 - startDate.getDay() + 7) % 7);
        
        // Định dạng ngày và giờ (YYYYMMDDTHHMMSS)
        const dtStart = startDay.toISOString().slice(0, 10).replace(/-/g, '') + 'T' + startTime;
        const dtEnd = startDay.toISOString().slice(0, 10).replace(/-/g, '') + 'T' + endTime;
        const uid = Date.now() + '-' + monHoc.maMH + '-' + monHoc.thu + Math.random();
        
        ics += "BEGIN:VEVENT\n";
        ics += `UID:${uid}\n`;
        ics += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z\n`;
        ics += `SUMMARY:${escapeIcsValue(monHoc.tenMon)} (${monHoc.loaiGio})\n`;
        ics += `LOCATION:${escapeIcsValue(monHoc.phongHoc || 'Không rõ')}\n`;
        ics += `DESCRIPTION:GV: ${escapeIcsValue(monHoc.giaoVien || 'Không rõ')}\\nTiết: ${monHoc.tiet}\\nTuần: ${monHoc.tuanHoc || 'Cả kỳ'}\n`;
        
        // Lặp lại 15 tuần (COUNT=15)
        ics += `RRULE:FREQ=WEEKLY;BYDAY=${dayMapping[monHoc.thu]};COUNT=15\n`; 
        
        ics += `DTSTART;TZID=Asia/Ho_Chi_Minh:${dtStart}\n`; 
        ics += `DTEND;TZID=Asia/Ho_Chi_Minh:${dtEnd}\n`;
        ics += "END:VEVENT\n";
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

    const newSubject = {
        tenMon: document.getElementById('tenMon').value,
        tiet: document.getElementById('tiet').value,
        thu: document.getElementById('thu').value,
        phongHoc: document.getElementById('phongHoc').value,
        giaoVien: document.getElementById('giaoVien').value,
        loaiGio: document.getElementById('loaiGio').value,
        tuanHoc: document.getElementById('tuanHoc').value,
        tt: 0, 
        maMH: '', 
        nhom: ''
    };

    scheduleData.push(newSubject);

    addFormContainer.classList.add('hidden');
    showAddFormBtn.style.display = 'inline-block';
    exportCalendarBtn.style.display = 'inline-block';
    addScheduleForm.reset();

    renderTable();
    alert(`Đã thêm môn học: ${newSubject.tenMon} vào Thứ ${newSubject.thu}!`);
});

// 2. Logic Xuất Lịch (iCal)
exportCalendarBtn.addEventListener('click', () => {
    const icsContent = createIcsContent();
    const filename = 'LichHoc_HocKy.ics';
    
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    
    // Kích hoạt click giả lập
    document.body.appendChild(link);
    link.click();
    
    // Dọn dẹp
    document.body.removeChild(link);
    URL.revokeObjectURL(url); 
    
    alert("File lịch học (.ics) đã được tải xuống! Vui lòng mở file này.");
});

// Khởi tạo bảng lần đầu
renderTable();
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { AttendanceRecord } from '../types';

export const exportPersonAttendancePDF = (records: AttendanceRecord[], personName: string) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`Attendance Report - ${personName}`, 14, 22);
  
  // Add generation date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
  
  // Add summary
  const totalRecords = records.length;
  const lateRecords = records.filter(r => r.isLate).length;
  const onTimeRecords = totalRecords - lateRecords;
  
  doc.setFontSize(12);
  doc.text(`Total Attendance: ${totalRecords}`, 14, 45);
  doc.text(`On Time: ${onTimeRecords}`, 14, 52);
  doc.text(`Late Arrivals: ${lateRecords}`, 14, 59);
  
  // Prepare table data
  const tableData = records.map((record, index) => [
    index + 1,
    record.date,
    record.time,
    record.isLate ? 'Late' : 'On Time'
  ]);
  
  // Add table
  (doc as any).autoTable({
    startY: 70,
    head: [['#', 'Date', 'Time', 'Status']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 10 },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });
  
  // Save the PDF
  doc.save(`${personName}_attendance_report.pdf`);
};

export const exportAllAttendancePDF = (records: AttendanceRecord[]) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Complete Attendance Report', 14, 22);
  
  // Add generation date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
  
  // Prepare table data
  const tableData = records.map((record, index) => [
    index + 1,
    record.name,
    record.date,
    record.time,
    record.isLate ? 'Late' : 'On Time'
  ]);
  
  // Add table
  (doc as any).autoTable({
    startY: 40,
    head: [['#', 'Name', 'Date', 'Time', 'Status']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });
  
  // Save the PDF
  doc.save('complete_attendance_report.pdf');
};
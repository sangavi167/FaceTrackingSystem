const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const selectedTeacher = teachers.find(t => t.id === formData.requestedTo);
    if (!selectedTeacher) return;

    const newApplication = {
      employeeId: currentUser.id,
      employeeName: currentUser.fullName,
      requestedToTeacherId: selectedTeacher.id,
      requestedToTeacherName: selectedTeacher.fullName,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      purpose: formData.purpose,
      location: formData.location,
    };

    const submittedApplication = hrManager.submitODApplication(newApplication);
    setApplications([submittedApplication, ...applications]);
    setShowForm(false);
    setFormData({
      date: '',
      startTime: '',
      endTime: '',
      purpose: '',
      location: '',
      requestedTo: ''
    });
  };
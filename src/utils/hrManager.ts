@@ .. @@
   submitODApplication(application: Omit<ODApplication, 'id' | 'appliedDate' | 'status'>): ODApplication {
     const newApplication: ODApplication = {
       ...application,
       id: `od_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
       appliedDate: new Date().toISOString().split('T')[0],
       status: 'pending'
     };

     const applications = this.getODApplications();
     applications.unshift(newApplication);
     localStorage.setItem(this.OD_KEY, JSON.stringify(applications));

     return newApplication;
   }
export let globalData = {
    course_key: '',
    story_key: '',
    category_key: ''
  };
  export function addMonthsWithValidDate(startDate: Date, monthsToAdd: number): string {
    const originalDay = startDate.getDate();
    const newDate = new Date(startDate.setMonth(startDate.getMonth() + monthsToAdd));
  
    if (newDate.getDate() < originalDay) {
        newDate.setDate(0); 
    }
    return newDate.toISOString().split('T')[0];
  }
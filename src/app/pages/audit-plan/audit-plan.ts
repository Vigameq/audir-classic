import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-audit-plan',
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-plan.html',
  styleUrl: './audit-plan.scss',
})
export class AuditPlan {
  protected noteChars = 0;
  protected auditForm = {
    startDate: '',
    endDate: '',
    auditType: '',
    auditSubtype: '',
    auditorName: '',
    department: '',
    locationCity: '',
    site: '',
    country: '',
    region: '',
    auditNote: '',
  };

  protected readonly auditTypes = [
    'Internal',
    'ISO 27001',
    'SOC 2',
    'SOX',
    'PCI DSS',
    'HIPAA',
  ];

  protected readonly citiesByCountry: Record<string, string[]> = {
    India: [
      'Agartala',
      'Agra',
      'Ahmedabad',
      'Ajmer',
      'Aligarh',
      'Allahabad',
      'Amritsar',
      'Aurangabad',
      'Bengaluru',
      'Bhopal',
      'Bhubaneswar',
      'Chandigarh',
      'Chennai',
      'Coimbatore',
      'Cuttack',
      'Dehradun',
      'Delhi',
      'Dhanbad',
      'Faridabad',
      'Gaya',
      'Ghaziabad',
      'Gurugram',
      'Guwahati',
      'Gwalior',
      'Hyderabad',
      'Indore',
      'Jaipur',
      'Jabalpur',
      'Jamshedpur',
      'Jodhpur',
      'Kanpur',
      'Kochi',
      'Kolkata',
      'Kota',
      'Kozhikode',
      'Lucknow',
      'Ludhiana',
      'Madurai',
      'Mangaluru',
      'Meerut',
      'Mumbai',
      'Mysuru',
      'Nagpur',
      'Nashik',
      'Noida',
      'Panaji',
      'Patna',
      'Pimpri-Chinchwad',
      'Pune',
      'Raipur',
      'Rajkot',
      'Ranchi',
      'Surat',
      'Thane',
      'Thiruvananthapuram',
      'Tiruchirappalli',
      'Udaipur',
      'Vadodara',
      'Varanasi',
      'Vijayawada',
      'Visakhapatnam',
    ],
    USA: [
      'Atlanta',
      'Austin',
      'Baltimore',
      'Boston',
      'Charlotte',
      'Chicago',
      'Columbus',
      'Dallas',
      'Denver',
      'Detroit',
      'Houston',
      'Indianapolis',
      'Jacksonville',
      'Kansas City',
      'Las Vegas',
      'Los Angeles',
      'Miami',
      'Minneapolis',
      'Nashville',
      'New York',
      'Orlando',
      'Philadelphia',
      'Phoenix',
      'Pittsburgh',
      'Portland',
      'Raleigh',
      'San Antonio',
      'San Diego',
      'San Francisco',
      'San Jose',
      'Seattle',
      'Tampa',
      'Washington, DC',
    ],
    Canada: [
      'Calgary',
      'Edmonton',
      'Halifax',
      'Hamilton',
      'Kitchener',
      'London',
      'Montreal',
      'Ottawa',
      'Quebec City',
      'Regina',
      'Saskatoon',
      'St. John\'s',
      'Toronto',
      'Vancouver',
      'Victoria',
      'Winnipeg',
    ],
  };

  protected get cities(): string[] {
    return this.citiesByCountry[this.auditForm.country] ?? [];
  }

  protected updateNoteChars(value: string): void {
    this.noteChars = value.length;
  }

  protected cancel(form: NgForm): void {
    this.auditForm = {
      startDate: '',
      endDate: '',
      auditType: '',
      auditSubtype: '',
      auditorName: '',
      department: '',
      locationCity: '',
      site: '',
      country: '',
      region: '',
      auditNote: '',
    };
    this.noteChars = 0;
    form.resetForm(this.auditForm);
  }

  protected createAudit(form: NgForm): void {
    if (form.invalid) {
      return;
    }
    this.cancel(form);
  }
}

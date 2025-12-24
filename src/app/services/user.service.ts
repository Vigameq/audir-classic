import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export type User = {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  email: string;
  phone?: string | null;
  department?: string | null;
  role: string;
  status: string;
  last_active?: string | null;
};

export type UserCreate = {
  first_name?: string | null;
  last_name?: string | null;
  email: string;
  phone?: string | null;
  department?: string | null;
  role: string;
  status: string;
  password: string;
};

export type UserUpdate = {
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  department?: string | null;
  role?: string | null;
  status?: string | null;
};

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly baseUrl = 'http://localhost:8000';

  constructor(private readonly http: HttpClient) {}

  listUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/users`);
  }

  createUser(payload: UserCreate): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/users`, payload);
  }

  updateUser(userId: number, payload: UserUpdate): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/users/${userId}`, payload);
  }

  resetPassword(userId: number, newPassword: string): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/users/${userId}/reset-password`, {
      new_password: newPassword,
    });
  }
}

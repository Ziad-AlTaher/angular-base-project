import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseService } from '../base/base.service';
import { ContactMessage } from '../models/contact-message.model';

@Injectable({
    providedIn: 'root'
})
export class ContactService extends BaseService<ContactMessage> {

    constructor(http: HttpClient) {
        super(http, 'ContactUs');
    }
}

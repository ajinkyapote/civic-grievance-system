package com.civic.grievance.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class AlertDispatchService {

    @Async
    public void sendCrewDispatchAlert(String engineerName, String engineerEmail, String ticketCode, String wardName) {
        log.info("[ASYNC DISPATCH ALERT] To: {} <{}> | Work Order {} assigned in {} — SLA clock active.",
            engineerName, engineerEmail, ticketCode, wardName);
    }

    @Async
    public void sendSlaEscalationAlert(String ticketCode, String department, String wardName) {
        log.warn("[ASYNC SLA ESCALATION] Ticket {} ({} / {}) breached statutory SLA -> Promoted to L3_CRITICAL_BREACH.",
            ticketCode, department, wardName);
    }
}

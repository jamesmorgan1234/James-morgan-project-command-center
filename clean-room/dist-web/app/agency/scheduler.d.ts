export interface SchedulerLeadership {
    readonly leaderId: string;
    readonly term: number;
    readonly fencingToken: number;
    readonly acquiredAt: string;
    readonly expiresAt: string;
}
export declare class SchedulerControlPlane {
    #private;
    acquire(candidateId: string, now: string, expiresAt: string): SchedulerLeadership;
    assertLeader(leaderId: string, fencingToken: number, now: string): void;
    current(): SchedulerLeadership | undefined;
}

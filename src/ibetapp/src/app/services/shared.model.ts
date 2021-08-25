export interface Bet {
    betKey: string;
    creator: string;
    eventText: string;
    eventTime: Date;
    betType: number;
    arbitratorType: number;
    amount: number;
    escrowBalance: number;
    arbitrator: string;
    arbitratorName: string;
    winScenario: string;
    loseScenario: string;
    cancelScenario: string;
    arbitratorCommission: number;
    betAgainstAmount: number;
    eventTimeString: string;
}
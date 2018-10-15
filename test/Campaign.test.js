describe('Campaign Contract', () => {
    describe('initialize', () => {
        it('should deploy');
        it('storage variable: manager = user who deployed contract');
        it('storage variable: minimumContribution = uint value we set');
        it('storage variable: approvers = array of addresses should be empty');
        it('storage variable: requests = array of Request struct should be empty');
    });

    describe('contribute', () => {
        it('should increase balance of account by donation made');
        it('should not add address to approvers array if donation < minimum contribution');
        it('should add address to approvers if donation >= minimum contribution');
    });

    describe('createRequest', () => {
        it('should require that manager call it');
        it('should add Request struct to request storage array');
    });

    describe('approveRequest', () => {
        it('should require that only members of approvers storage array can call it');
        it('should add user address to Request struc\'s approvers field');
    });

    describe('finalizeRequest', () => {
        it('should require that manager call it');
        it('should require that enough approvers have voted yes');
        it('should send Request.value to vendor address');
    });
});
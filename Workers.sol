import "./People.sol";
pragma solidity 0.5.12;

contract Workers is People{ //- Should inherit from the People Contract. 
   
    mapping(address => uint) internal salary;//- Should extend the People contract by adding another mapping called salary which maps an address to an integer. 
    mapping(address => address) internal manager;//For each worker created, you need to input and save information about who (which address) is the boss. This should be implemented in the Worker contract.

    function createWorker(address workerId, string memory name, uint age, uint height, uint wages) public{//- Have a createWorker function which is a wrapper function for the createPerson function. Make sure to figure out the correct visibility level for the createPerson function (it should no longer be public).
        require(age <= 75, "Age can not exceed 75");//- When creating a worker, the persons age should not be allowed to be over 75. 
        require(workerId != msg.sender, "Worker can not be his/her own boss");
        createPerson(name, age, height);//- Apart from calling the createPerson function
        salary[workerId] = wages;//the createWorker function should also set the salary for the Worker in the new mapping.
        manager[workerId] = msg.sender;
    }
    
    function fire(address workerId) public{
        require(msg.sender == manager[workerId], "Caller needs to be the manager of this worker");//Make sure that a worker can only be fired by his/her boss.
        deletePerson(workerId);
        delete salary[workerId];
        delete manager[workerId];
    }
}
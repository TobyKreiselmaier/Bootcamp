pragma solidity 0.5.12;

contract PeopleArrayAssignment{
   
     address public owner;
      
     constructor() public{
         owner = msg.sender;
     }
     
     struct Person {
        string name;
        uint age;
        uint height;
        bool senior;
        address creator;
      }

    Person[] public people;
    mapping(address => uint) public numberPersonsCreatedByAddress;
    
    function createPerson(string memory _name, uint _age, uint _height) public {
        Person memory newPerson;
        newPerson.name = _name;
        newPerson.age = _age;
        newPerson.height = _height;
        if(_age >= 65){
            newPerson.senior = true;
        } else {
            newPerson.senior = false;
        }
        newPerson.creator = msg.sender;
        insertPerson(newPerson);
        numberPersonsCreatedByAddress[newPerson.creator]++;
    }
    
    function insertPerson(Person memory _newPerson) private {
        people.push(_newPerson);
    }
    
    function getPerson(uint _index) public view returns(string memory _name, uint _age, uint _height, bool _senior, address _creator) {
        return (people[_index].name, people[_index].age, people[_index].height, people[_index].senior, people[_index].creator);    
    }
    
    function returnArray(address _creator) public view returns(uint[] memory) {
        uint[] memory idsOfCreator = new uint[](numberPersonsCreatedByAddress[_creator]);
        uint idCounter = 0;
        for (uint i = 0; i < people.length; i++){
            if (people[i].creator == _creator) {
                idsOfCreator[idCounter] = i;
                idCounter++;
            }
        }
        return idsOfCreator;
    }
}
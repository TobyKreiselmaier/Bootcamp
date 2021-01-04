pragma solidity 0.5.12;

contract PeopleUpdateAssignment{
   
     struct Person {
        string name;
        uint age;
        uint height;
        bool senior;
      }
      
      event personCreated(string name, bool senior, address createdBy);
      event personUpdated(string nameOld, bool seniorOld, string nameNew, bool seniorNew, address updatedBy);
      event personDeleted(string name, bool senior, address deletedBy);
      
      address public owner;
      
      modifier onlyOwner(){
          require(msg.sender == owner, "Caller needs to be owner of the contract");
          _;
      }
      
      constructor() public{ 
          owner = msg.sender;
      }

    mapping(address => Person) private people;

    address[] private creators;

    function createPerson(string memory name, uint age, uint height) public {
        if (keccak256(abi.encodePacked(people[msg.sender].name)) == keccak256(abi.encodePacked(""))) {
            require(age < 130, "Age needs to be below 130");
            Person memory newPerson;
            newPerson.name = name;
            newPerson.age = age;
            newPerson.height = height;
            
            if(age >= 65){
                newPerson.senior = true;
            } else {
                newPerson.senior = false;
            }
            
            insertPerson(newPerson);
            creators.push(msg.sender);
            assert(
                keccak256(
                    abi.encodePacked(
                        people[msg.sender].name,
                        people[msg.sender].age,
                        people[msg.sender].height,
                        people[msg.sender].senior
                    )
                ) 
                == 
                keccak256(
                    abi.encodePacked(
                        newPerson.name,
                        newPerson.age,
                        newPerson.height,
                        newPerson.senior
                    )
                )
            ); 
            emit personCreated(newPerson.name, newPerson.senior, msg.sender);
        } else {
            string memory nameOld = people[msg.sender].name;
            bool seniorOld = people[msg.sender].senior;
            require(age < 150, "Age needs to be below 150");
            Person memory newPerson;
            newPerson.name = name;
            newPerson.age = age;
            newPerson.height = height;
            
            if(age >= 65){
                newPerson.senior = true;
            } else {
                newPerson.senior = false;
            }
            
            insertPerson(newPerson);
            creators.push(msg.sender);
            assert(
                keccak256(
                    abi.encodePacked(
                        people[msg.sender].name,
                        people[msg.sender].age,
                        people[msg.sender].height,
                        people[msg.sender].senior
                    )
                ) 
                == 
                keccak256(
                    abi.encodePacked(
                        newPerson.name,
                        newPerson.age,
                        newPerson.height,
                        newPerson.senior
                    )
                )
            ); 
            emit personUpdated(nameOld, seniorOld, newPerson.name, newPerson.senior, msg.sender);
        }
    }
    
    function insertPerson(Person memory newPerson) private {
        address creator = msg.sender;
        people[creator] = newPerson;
    }
    
    function getPerson() public view returns(string memory name, uint age, uint height, bool senior) {
        address creator = msg.sender;
        return (people[creator].name, people[creator].age, people[creator].height, people[creator].senior);    
    }
    
    function deletePerson(address creator) public onlyOwner{
        string memory name = people[creator].name;
        bool senior = people[creator].senior;
        delete people[creator];
        assert(people[creator].age == 0);
        emit personDeleted(name, senior, msg.sender);
    }
    
    function getCreator(uint index) public view onlyOwner returns(address){
        return creators[index];
    }
}
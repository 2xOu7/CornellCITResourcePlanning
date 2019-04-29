import React from 'react';
import { Link } from 'react-router-dom';
import './style.css';


class twoList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentResources: {},       //dictionary, key:NetID, value:ResourceValue
            avaliableResources: {},     //dictionary, key:NetID, value:ResourceValue
            toadd: [],                  //array, NetID
            toremove: [],                //array, NetID
            currentList: [],            //array, ResourceValue
            avaliableList: [],          //array, ResourceValue
            projectName: "",
        }
        this.projectID = this.props.match.params.projectID;

        this.handleAdd = this.handleAdd.bind(this);
        this.handleRemove = this.handleRemove.bind(this);
        this.clickHandler = this.clickHandler.bind(this);
        this.searchFunc = this.searchFunc.bind(this);
    }

    /**
     * Function pre Process data to generate initial list view
     */
    async processData(data, flag) {
        var dict = {};

        if (flag == 0) {
            for (var i in data) {
                let id = data[i].NetID;
                dict[id] = data[i];
            }
            this.setState({
                currentResources: dict,
                currentList: Object.values(dict),
            });
        } else {
            for (var i in data) {
                let id = data[i].NetID;
                if (!(this.state.currentResources.hasOwnProperty(id))) {
                    dict[id] = data[i]
                }
            }
            this.setState({
                avaliableResources: dict,
                avaliableList: Object.values(dict),
            });
        }
    }

    componentDidMount() {
        this.fetchResources(this.projectID);
        //fetch returns a promise
        this.getProjectName(this.projectID);
    }

    async fetchResources(projectID) {

        fetch(`../api/displayResourcesPerProject/${projectID}`)
            .then(result => result.json())
            .then(data => this.processData(data, 0));

        fetch(`../api/displayAllResources`)
            .then(result => result.json())
            .then(data => this.processData(data, 1));
    }

    async getProjectName(projectID){
        fetch(`../api/displayProjectNameById/${projectID}`)
            .then(result => result.json())
            .then(data => this.setState({projectName:data[0].ProjectName}));
    }


    clickHandler(evt) {
        var flag = true;
        if (evt.currentTarget.dataset.selected == 0) {
            evt.currentTarget.style.backgroundColor = "#19e88e";
            evt.currentTarget.dataset.selected = 1;
        } else {
            evt.currentTarget.style.backgroundColor = "#f6f6f6";
            evt.currentTarget.dataset.selected = 0;
            flag = false;
        }
        var netid = evt.currentTarget.dataset.id;
        if (this.state.avaliableResources.hasOwnProperty(netid)) {
            if (flag) {
                //add to toadd
                this.state.toadd.push(netid);
            } else {
                //remove from toadd
                let index = this.state.toadd.indexOf(netid);
                this.state.toadd.splice(index, 1);
            }
        } else {
            if (flag) {
                //add to toremove
                this.state.toremove.push(netid);
            } else {
                //remove from toremove
                let index = this.state.toremove.indexOf(netid);
                this.state.toremove.splice(index, 1);
            }
        }
        // console.log('----------');
        // console.log(this.state.toadd);
        // console.log(this.state.toremove);
    }


    generateListElements(renderList, actionList, handler) {
        // console.log("------------------------");
        // console.log(resDic);


        var resourcesList = renderList.map(function (resource) {
            if (actionList.indexOf(resource.NetID) > -1) {
                return <li key={resource.NetID} data-selected={1} data-id={resource.NetID} onClick={handler} style={{ backgroundColor: "#19e88e" }}>
                    <span className="liname">{resource.FirstName} {resource.LastName}</span>
                    {resource.Role}
                </li>
            } else {
                return <li key={resource.NetID} data-selected={0} data-id={resource.NetID} onClick={handler}>
                    <span className="liname">{resource.FirstName} {resource.LastName}</span>
                    {resource.Role}
                </li>
            }
        });
        return resourcesList;
    }


    /**
     * This is a function to handle serach function, param flag is to 
     * determine whether it is serving for avaliable resources list or current
     * resources list.
     * @param {event} evt 
     * @param {int 0 or 1} flag 
     */

    searchFunc(evt, flag) {
        let search, itemDict;
        let renderList = [];
        search = evt.target;
        if (flag == 0) {
            itemDict = this.state.avaliableResources;
        } else {
            itemDict = this.state.currentResources;
        }

        let itemList = Object.values(itemDict);

        if (search.value == "") {
            renderList = itemList;
        } else {
            let filter = search.value.toUpperCase();
            for (var i = 0, len = itemList.length; i < len; i++) {
                let FullName = itemList[i].FirstName.toUpperCase().concat(' ', itemList[i].LastName.toUpperCase());
                if (FullName.indexOf(filter) > -1) {
                    renderList.push(itemList[i]);
                }
            }
        }


        if (flag == 0) {
            this.setState({ avaliableList: renderList });
        } else {
            this.setState({ currentList: renderList });
        }
    }

    async handleAdd(evt, rolename) {
        // let newCurrentResources = this.state.currentResources;
        // let newCurrentList = [];
        // let newAvaliableResources = this.state.avaliableResources;
        // let newAvaliableList = [];
        for (var i = 0, len = this.state.toadd.length; i < len; i++) {
            let netid = this.state.toadd[i];
            let data = {
                "ProjectName": this.state.projectName,
                "NetID": netid,
                "Role": rolename,
            };
            await fetch(`../api/addResourcePerProject`, {
                method: 'POST',
                headers: {
                    'Accepter': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
        }
        // console.log('add done');
        this.state.toadd = [];
        this.fetchResources(this.projectID);
    }

    async handleRemove(evt) {
        // console.log(this.projectName);
        for (var i = 0, len = this.state.toremove.length; i < len; i++) {
            let data = {
                "ProjectName": this.state.projectName,
                "NetID": this.state.toremove[i],
            };
            await fetch(`../api/deleteResourcePerProject`, {
                method: `DELETE`,
                headers: {
                    'Accepter': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
        }
        // console.log('remove done');
        this.state.toremove = [];
        this.fetchResources(this.projectID);
    }

    render() {
        var leftList = this.generateListElements(this.state.avaliableList, this.state.toadd, this.clickHandler);
        var rightList = this.generateListElements(this.state.currentList, this.state.toremove, this.clickHandler);
        return (
            <div style={{height:'550px'}}>
                <h1>Project: {this.state.projectName}</h1>
                <div className="leftContainer">
                    <p>Avaliable resources to add to project</p>
                    <input className="myInput" type="text" onChange={event => this.searchFunc(event, 0)} placeholder="Search for names..." />
                    <ul className="myUL">
                        {leftList}
                    </ul>
                    <button onClick={(event) => this.handleAdd(event, "Programmer")}>Add as Programmer</button>
                    <button onClick={(event) => this.handleAdd(event, "Product Manager")}>Add as PM</button>
                </div>
                <div className="rightContainer">
                    <p>Current resources in this project</p>
                    <input className="myInput" type="text" onChange={event => this.searchFunc(event, 1)} placeholder="Search for names..." />
                    <ul className="myUL">
                        {rightList}
                    </ul>
                    <button onClick={this.handleRemove}>Remove Resources</button>
                </div>
            </div>
        );
    }
}

export default twoList
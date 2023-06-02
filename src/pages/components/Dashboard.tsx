import React, { useState, useEffect } from 'react';
import { signIn, signOut, useSession } from "next-auth/react";
import ChartContainer from './ChartContainer';
import { DashBlank } from './DashBlank';
import { api } from "~/utils/api";


interface DashboardProps {
  initialClusterIP: string;
  clusterIPArray: Array<any>;
  refetchClusterIPArray: any;
  snapshotObj: any;
  setSnapshotObj: any;
  dashNum: number;
  currClusterId: string;
}

interface snapshotProps {
  clusterIP:string
  createdAt:any //datetime?
  id: string
  label: string
  unixtime:any
  updatedAt:any 
  userId:string

}

function filterByIp (notFiltered:Array<snapshotProps>, ip:string) : Array<snapshotProps>{
  return notFiltered.filter(el=>{
    return el.clusterIP === ip ? true : false
  })
}


const Dashboard: React.FC<DashboardProps> = ({ initialClusterIP, clusterIPArray, refetchClusterIPArray, snapshotObj, setSnapshotObj, dashNum }) => {
  const [currentTimeStamp, setCurrentTimeStamp] = useState('now');
  const { data: sessionData } = useSession();
  
  const [currentClusterIP, setCurrentClusterIP] = useState(initialClusterIP);
  
  // hooks for snapshot management
  const { data: unfilteredSnapshots, refetch: refetchunfilteredSnapshots } = api.snapshot.getAll.useQuery()
  // const { data: filteredSnapshots, refetch: refetchfilteredSnapshots } = api.snapshot.getByUserCluster.useQuery({clusterIP: initialClusterIP})
  // state containing filtered snaps by clusterIP
  const [filteredByIPSnaps, setfilteredByIPSnaps] = useState(filterByIp(unfilteredSnapshots, currentClusterIP))
  
  const [labelName, setLabelName] = useState('')
  
  const [ipArray, setipArray] = useState([]);

  const handleTabClick = async(ip: string) => {
    setCurrentClusterIP(ip);
    console.log('current cluster ip', currentClusterIP)
    
    // refetch and rerender the available snaps
    // get the unfiltered check with console.log(unfilteredSnapshots)
    await refetchunfilteredSnapshots();
    
    //set the filtered filteredByIPSnaps
     setfilteredByIPSnaps(filterByIp(unfilteredSnapshots, currentClusterIP))
    // modify snapshotObj
    // set snapshotObj to object with labels of labels, values
    
    const updatedSnapshotObj:any = {}
    
    filteredByIPSnaps.forEach(el=>{
      updatedSnapshotObj[el.label] = el.unixtime
      
    })

    console.log(updatedSnapshotObj)
    // update the snapshot object with the new object
    await setSnapshotObj({...updatedSnapshotObj  })
    console.log(snapshotObj)

  };
  
  // hook to create snapshot in db
  const createNewSnapshot = api.snapshot.createNew.useMutation({
    onSuccess:()=>{
      refetchunfilteredSnapshots();
      console.log(`the snapshots, unfiltered`, unfilteredSnapshots)
      console.log(`the snapshots, filtered`, filterByIp(unfilteredSnapshots, currentClusterIP))
      // console.log(`the snapshots, filtered by ${currentClusterIP} and user`, unfilteredSnapshots)
    }
  })


  // eventHandlers 

  // add a property in snapshotObj 
  const handleSnapshotSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const unixTimeStamp = Date.now();
    const date = new Date(unixTimeStamp);
    const formattedDate = date.toLocaleString()
    const obj = { ...snapshotObj }
  // if labelName exists add a property into snapshotObj    labelName: Unix Time  otherwise add a property as    M/D/Y Time: Unix Time
    console.log(labelName)
    labelName ? obj[labelName] = unixTimeStamp : obj[formattedDate] = unixTimeStamp  
    setSnapshotObj(obj)
    createNewSnapshot.mutate({
      unixtime: unixTimeStamp,
      label: labelName,
      clusterIP: currentClusterIP
    })
    console.log('new snapshotObj', snapshotObj)
  }

  // set currentTimeStamp state to option we choose on the dropbown
  const handleDashboardChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    event.preventDefault()
    const changedTimeStamp = event.target.value
    // console.log('snapshotObj', snapshotObj, 'event value', event.target.value)
    // console.log('changedTimeStamp', changedTimeStamp)
    setCurrentTimeStamp(changedTimeStamp)
    // console.log('currentTimeStamp', currentTimeStamp)
  }


  // set labelName to our input 
  const handleLabelChange = (event: any) => {
    event.preventDefault()
    setLabelName(event.target.value)
  }

  return (
    <>
    {/* {currentClusterIP} */}
    
      {dashNum === 1 ?
        (<div className="tabs flex justify-center">
          {clusterIPArray?.map((obj) => {
            
            return (
              <a
              key={obj.ipAddress}
              className={`tab tab-lg tab-lifted ${obj.ipAddress === currentClusterIP ? 'tab-active' : ''}`}
              onClick={() => handleTabClick(obj.ipAddress)}
            >
                {obj.ipAddress}
              </a>
            );
          })
          }
        </div>) : ''}


      <div className="bg-accent/20 rounded-xl p-2 mb-6">
        <div className="flex justify-between ">
          <div className="dropdown dropdown-right ml-2">
            <label tabIndex={0} className="btn bg-info/10 m-1 ">{dashNum === 1? "Select Dashboard": "Select Snapshot"}</label>
            <select
              tabIndex={0}
              className="dropdown-content w-52 h-8 ml-1 mt-3 "
              onChange={handleDashboardChange}
            >
              {dashNum === 2 ? Object.keys(snapshotObj).map(ip => {
                if (ip !== 'Current')
                  return (
                    <option value={snapshotObj[ip]}>{ip}</option>
                  );
              }) : Object.keys(snapshotObj).map(ip => (
                <option value={snapshotObj[ip]}>{ip}</option>
              ))}
            </select>
          </div>



        {/* snapshot button */}
          {dashNum === 1 ? (
            <div className="mr-2">
            <form action="">
              <input type="text"
              placeholder='Snapshot Label' 
              onChange={handleLabelChange}
              className="input input-bordered max-h-xs max-w-xs bg-info/10 rounded-xl mr-3"/>
                {/* right margin of 2 units */}
                <button className="btn bg-info/10" onClick={handleSnapshotSubmit}>Snapshot</button>
            </form>
              </div>

            // other snapshot button
            // <div className="mr-2">
            //   <button className="btn bg-info/10" onClick={handleSnapshotSubmit}>Snapshot</button>
            // </div>
          ) : ''}
        </div>
          




        {(dashNum === 2 && Object.keys(snapshotObj).length > 1) ? (
          <ChartContainer currentClusterIP={currentClusterIP} currentTimeStamp={currentTimeStamp} />
        ) : (dashNum === 1 ? (
          <ChartContainer currentClusterIP={currentClusterIP} currentTimeStamp={currentTimeStamp} />
        ) : (
          <DashBlank />
        ))}

      </div>
    </>
  );
};

export default Dashboard;

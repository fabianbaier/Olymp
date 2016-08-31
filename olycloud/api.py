from flask import Flask, jsonify, make_response, request, abort
import requests
import json
import websockets
import sys
import os

conf_dir_default = os.path.expanduser('/Users/fabianbaier/Documents/MyProjects/webinterface/Olymp/olycloud')
crtfilename = 'client.crt'
keyfilename = 'client.key'
crt = os.path.join(conf_dir_default, crtfilename)
key = os.path.join(conf_dir_default, keyfilename)

app = Flask(__name__)

tasks = [
    {
        'id': 1,
        'title': u'Buy groceries',
        'description': u'Milk, Cheese, Pizza, Fruit, Tylenol',
        'done': False
    },
    {
        'id': 2,
        'title': u'Learn Python',
        'description': u'Alex you are cool!',
        'done': False
    }
]

@app.after_request
def after_request(response):
  response.headers.add('Access-Control-Allow-Origin', '*')
  response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
  return response

@app.route('/v1.0/tasks', methods=['GET'])
def get_tasks():
    return jsonify({'tasks': tasks})

@app.route('/v1.0/containers', methods=['GET'])
def get_containers():
    lxdapi = requests.get('https://192.168.1.128:8443/1.0/containers', verify=False, cert=(crt, key))
    lxdapi = lxdapi.json()
    clusterlist=[]
    for i in range(len(lxdapi['metadata'])):
        lxdapi2 = requests.get('https://192.168.1.128:8443/1.0/containers/'+lxdapi['metadata'][i].replace('/1.0/containers/',''), verify=False, cert=(crt, key))
        lxdapi2 = lxdapi2.json()
        #clusterlist.append(lxdapi['metadata'][i].replace('/1.0/containers/',''))
        clusterlist.insert(i,lxdapi2)
    clusterall = {'clusterlist': clusterlist}
    return jsonify(clusterall)

@app.route('/v1.0/containers/<string:name>', methods=['GET'])
def get_clusters(name):
    lxdapi = requests.get('https://192.168.1.128:8443/1.0/containers/'+name, verify=False, cert=(crt, key))
    lxdapi = lxdapi.json()
    cluster_name = [{'clustername': lxdapi}]
    return jsonify(cluster_name)

@app.route('/v1.0/containers/start/<string:name>', methods=['PUT'])
def start_clusters(name):
    data = {
        "action": "start"       # State change action (stop, start, restart, freeze or unfreeze)
        }
    lxdapi = requests.put('https://192.168.1.128:8443/1.0/containers/'+name+'/state', json=data, verify=False, cert=(crt, key))
    lxdapi = lxdapi.json()
    cluster_name = [{'clusterstate': lxdapi}]
    return jsonify(cluster_name)

@app.route('/v1.0/containers/stop/<string:name>', methods=['PUT'])
def stop_clusters(name):
    data = {
        "action": "stop"       # State change action (stop, start, restart, freeze or unfreeze)
        }
    lxdapi = requests.put('https://192.168.1.128:8443/1.0/containers/'+name+'/state', json=data, verify=False, cert=(crt, key))
    lxdapi = lxdapi.json()
    cluster_name = [{'clusterstate': lxdapi}]
    return jsonify(cluster_name)

@app.route('/v1.0/containers/exec/<string:name>', methods=['POST'])
def post_clusterexec(name):
    data = {
        "command": ["/bin/bash"],
        "environment": {
            "HOME": "/root",
            "TERM": "xterm",
            "USER": "root"
            },
        "wait-for-websocket": True,
        "interactive": True
        }
    lxdapi = requests.post('https://192.168.1.128:8443/1.0/containers/'+name+'/exec', json=data, verify=False, cert=(crt, key))
    lxdapi = lxdapi.json()
    cluster_exec = {'clusterexec': lxdapi}
    return jsonify(cluster_exec)

@app.route('/v1.0/containers/state/<string:name>', methods=['GET'])
def get_clusterstate(name):
    lxdapi = requests.get('https://192.168.1.128:8443/1.0/containers/'+name+'/state', verify=False, cert=(crt, key))
    lxdapi = lxdapi.json()
    cluster_state = [{'clusterstate': lxdapi}]
    return jsonify(cluster_state)

@app.route('/v1.0/containers/logs/<string:name>', methods=['GET'])
def get_clusterlogs(name):
    lxdapi = requests.get('https://192.168.1.128:8443/1.0/containers/'+name+'/logs', verify=False, cert=(crt, key))
    lxdapi = lxdapi.json()
    cluster_logs = [{'clusterlogs': lxdapi}]
    return jsonify(cluster_logs)

@app.route('/v1.0/containers/networks/<string:name>', methods=['GET'])
def get_clusternetworks(name):
    lxdapi = requests.get('https://192.168.1.128:8443/1.0/networks/'+name, verify=False, cert=(crt, key))
    lxdapi = lxdapi.json()
    cluster_networks = [{'clusternetworks': lxdapi}]
    return jsonify(cluster_networks)

@app.route('/v1.0/wss/<path:path>', methods=['GET'])
def get_clusteroperationspathwss(path):
    print(path)
    print('You want path1: '+path+'?secret='+request.args['secret'])
    ws = requests.get('wss://192.168.1.128:8443/1.0/operations/'+path+'?secret='+request.args['secret'])
    print(ws)
    return ws

@app.route('/v1.0/operations', methods=['GET'])
def get_clusteroperations():
    lxdapi = requests.get('https://192.168.1.128:8443/1.0/operations', verify=False, cert=(crt, key))
    lxdapi = lxdapi.json()
    cluster_operations = [{'data': lxdapi}]
    return jsonify(cluster_operations)

@app.route('/v1.0/events', methods=['GET'])
def get_clusterevents():
    lxdapi = requests.get('https://192.168.1.128:8443/1.0/events?type=operation', verify=False, cert=(crt, key))
    #lxdapi = lxdapi.json()
    print(lxdapi)
    cluster_events = {'data': lxdapi}
    return jsonify(cluster_events)

@app.route('/v1.0/operations/test/<path:path>', methods=['GET'])
def get_clusteroperationspath(path):
    lxdapi = requests.get('https://192.168.1.128:8443/1.0/operations'+path, verify=False, cert=(crt, key))
    lxdapi = lxdapi.json()
    cluster_operations = [{'data': lxdapi}]
    print('You want path: '+path)
    return jsonify(cluster_operations)

@app.route('/v1.0/raw/containers', methods=['GET'])
def get_containers_rawdata():
    lxdapi = requests.get('https://192.168.1.128:8443/1.0/containers', verify=False, cert=(crt, key))
    lxdapi = lxdapi.json()
    containers_rawdata = {'container-rawdata': lxdapi}
    return jsonify(containers_rawdata)

@app.route('/v1.0/raw/certificates', methods=['GET'])
def get_certificates_rawdata():
    lxdapi = requests.get('https://192.168.1.128:8443/1.0/certificates', verify=False, cert=(crt, key))
    lxdapi = lxdapi.json()
    certificates_rawdata = [{'certificates-rawdata': lxdapi}]
    return jsonify(certificates_rawdata)

@app.route('/v<string:certid>', methods=['GET'])
def get_certificates_fingerprint_rawdata(certid):
    lxdapi = requests.get('https://192.168.1.128:8443/'+certid, verify=False, cert=(crt, key))
    lxdapi = lxdapi.json()
    certificates_fingerprint_rawdata = [{'certificates-fingerprint-rawdata': lxdapi}]
    return jsonify(certificates_fingerprint_rawdata)

@app.route('/v1.0/raw', methods=['GET'])
def get_rawdata():
    lxdapi = requests.get('https://192.168.1.128:8443/1.0', verify=False, cert=(crt, key))
    lxdapi = lxdapi.json()
    containers_rawdata = [{'container-rawdata': lxdapi, 'godmode': {'status': 'success', 'status_code': '200'}}]
    return jsonify(containers_rawdata)

@app.route('/v1.0/authenticate', methods=['GET'])
def start_authenticate():
    lxdapi = requests.get('https://192.168.1.128:8443/1.0', verify=False, cert=(crt, key))
    lxdapi = lxdapi.json()
    api_response = [{
    "container-rawdata": {
      "metadata": {
        "api_extensions": [],
        "api_status": "stable",
        "api_version": "1.0",
        "auth": "trusted",
        "public": 'false'
      },
      "status": "Success",
      "status_code": '200',
      "type": "sync"
    },
    "godmode": {
      "status": "success",
      "status_code": "200"
    }
  }]
    return jsonify(api_response)

@app.route('/v1.0/containers/raw/<string:task_id>', methods=['GET'])
def get_rawdata_container(task_id):
    lxdapi = requests.get('https://10.0.49.207:8443/1.0/containers/'+task_id+'/state', verify=False, cert=(crt, key))
    lxdapi = lxdapi.json()
    containers_rawdata = [{'container-rawdata': lxdapi}]
    return jsonify(containers_rawdata)

@app.route('/v1.0/<string:task_id>', methods=['GET'])
def get_task(task_id):
    task = [task for task in tasks if task['id'] == task_id]
    if len(task) == 0:
        abort(404)
    return jsonify({'task': task[0]})

@app.route('/v1.0/tasks', methods=['POST'])
def create_task():
    if not request.json or not 'title' in request.json:
        abort(400)
    task = {
        'id': tasks[-1]['id'] + 1,
        'title': request.json['title'],
        'description': request.json.get('description', ""),
        'done': False
    }
    tasks.append(task)
    return jsonify({'task': task}), 201

@app.errorhandler(500)
def not_found(error):
    return make_response(jsonify({'error': 'Not found'}), 500)

if __name__ == '__main__':
    app.run(debug=True)
    #app.run()

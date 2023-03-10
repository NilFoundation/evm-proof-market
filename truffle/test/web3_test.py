"""Utils for testing contracts with web3."""
import solcx

from web3 import Web3
from web3.middleware import geth_poa_middleware
import os
import inspect
import sys
from constants import solc_version, ledger_provider_address

tests_path = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))
base_path = tests_path + "/../../"
contracts_dir = base_path + "truffle/contracts"


def init_connection():
    w3 = Web3(
        Web3.HTTPProvider(ledger_provider_address, request_kwargs={"timeout": 600})
    )
    w3.middleware_onion.inject(geth_poa_middleware, layer=0)
    w3.eth.default_account = w3.eth.accounts[0]
    return w3


def find_compiled_contract(compiled, contract_name):
    compiled_id = None
    compiled_interface = False
    for key, value in compiled.items():
        if key.endswith(contract_name):
            compiled_id = key
            compiled_interface = value
            break
    else:
        print(f"{contract_name} not found!")
        sys.exit(1)
    return compiled_id, compiled_interface


def write_tx_calldata(w3, tx_receipt, ofname="tx_calldata.txt"):
    with open(ofname, "w", encoding="utf-8") as f:
        f.write(w3.eth.get_transaction(tx_receipt.transactionHash).input)


def print_tx_info(w3, tx_receipt, tx_name):
    print(tx_name)
    print(tx_receipt.transactionHash.hex())
    print("gasUsed =", tx_receipt.gasUsed)
    write_tx_calldata(w3, tx_receipt)


def deploy_link_libs(w3, compiled, test_contract_bytecode, linked_libs_names):
    linked_bytecode = test_contract_bytecode
    for lib_name in linked_libs_names:
        compiled_lib_id, component_lib = find_compiled_contract(compiled, lib_name)
        component_lib_bytecode = component_lib["bin"]
        component_lib_abi = component_lib["abi"]
        print(f"Lib {lib_name} bytecode size:", len(component_lib_bytecode) // 2)
        contract_lib = w3.eth.contract(
            abi=component_lib_abi, bytecode=component_lib_bytecode
        )
        deploy_lib_tx_hash = contract_lib.constructor().transact()
        deploy_lib_tx_receipt = w3.eth.wait_for_transaction_receipt(deploy_lib_tx_hash)
        linked_bytecode = solcx.link_code(
            linked_bytecode,
            {compiled_lib_id: deploy_lib_tx_receipt.contractAddress},
            solc_version=solc_version,
        )
    print("Bytecode size:", len(linked_bytecode) // 2)
    return linked_bytecode


def compile_and_deploy_contract(w3, contract_path, name):
    solcx.install_solc(solc_version)

    compiled = solcx.compile_files(
        [contract_path],
        allow_paths=[f"{contracts_dir}/"],
        output_values=["abi", "bin"],
        solc_version=solc_version,
        optimize=True,
        optimize_runs=200,
    )

    _, compiled_interface = find_compiled_contract(compiled, name)
    bytecode = compiled_interface["bin"]
    abi = compiled_interface["abi"]

    contract = w3.eth.contract(abi=abi, bytecode=bytecode)
    deploy_tx_hash = contract.constructor().transact()
    deploy_tx_receipt = w3.eth.wait_for_transaction_receipt(deploy_tx_hash)

    print("Deployment costs:", deploy_tx_receipt.gasUsed)
    print("contractAddress:", deploy_tx_receipt.contractAddress)

    contract_inst = w3.eth.contract(address=deploy_tx_receipt.contractAddress, abi=abi)
    return contract_inst

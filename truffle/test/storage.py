"""Test the RequestStorage contract: deploy and calls to basic functions."""
import web3_test

contract_name = "RequestStorage"

if __name__ == "__main__":
    w3 = web3_test.init_connection()
    contract_inst = web3_test.compile_and_deploy_contract(
        w3, f"{web3_test.contracts_dir}/{contract_name}.sol", contract_name
    )

    output = contract_inst.functions.test().call()
    print(output)

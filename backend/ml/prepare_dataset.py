import json
import os
import re
from datasets import load_dataset
try:
    import esprima
except ImportError:
    esprima = None

DATASET_NAME = "helloadhavan/github_issues"

OUTPUT_DIR = os.path.join(
    os.path.dirname(__file__),
    "dataset"
)

OUTPUT_FILE = os.path.join(
    OUTPUT_DIR,
    "risk-dataset.json"
)

def calculate_risk_level(
    changed_lines,
    added_lines,
    removed_lines,
    changed_functions,
    business_logic,
    state_change,
    api_change,
    direct_dependencies,
    indirect_dependencies
):
    score = 0

    if changed_lines >= 50:
        score += 3
    elif changed_lines >= 20:
        score += 2
    elif changed_lines >= 5:
        score += 1

    if changed_functions >= 3:
        score += 2
    elif changed_functions >= 1:
        score += 1

    if business_logic:
        score += 2
    if state_change:
        score += 2
    if api_change:
        score += 2

    if direct_dependencies >= 5:
        score += 2
    elif direct_dependencies >= 2:
        score += 1

    if indirect_dependencies >= 5:
        score += 2
    elif indirect_dependencies >= 2:
        score += 1

    if score >= 8:
        return "HIGH"
    if score >= 4:
        return "MEDIUM"
    return "LOW"


def extract_added_lines(patch):
    lines = patch.split('\n')
    added = [line[1:] for line in lines if line.startswith('+') and not line.startswith('+++')]
    return '\n'.join(added)


def traverse_ast(node, features):
    if not isinstance(node, esprima.nodes.Node):
        return
        
    t = node.type
    
    if t in ["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression", "MethodDefinition"]:
        features["changedFunctions"] += 1
    
    if t == "VariableDeclarator":
        features["changedVariables"] += 1
        
    if t in ["IfStatement", "ForStatement", "WhileStatement", "SwitchStatement", "ReturnStatement", "BinaryExpression"]:
        features["businessLogic"] = 1
        
    if t == "CallExpression":
        features["businessLogic"] = 1
        callee = getattr(node, "callee", None)
        if callee:
            callee_name = ""
            if callee.type == "Identifier":
                callee_name = callee.name
            elif callee.type == "MemberExpression":
                prop = getattr(callee, "property", None)
                if prop and prop.type == "Identifier":
                    callee_name = prop.name
            
            if callee_name in ["useState", "useReducer", "setState", "dispatch"]:
                features["stateChange"] = 1
            if callee_name in ["fetch", "axios", "request"]:
                features["apiChange"] = 1
            if callee_name in ["useNavigate", "useRouter", "push", "replace", "navigate"]:
                features["routingChange"] = 1
            if callee_name in ["addEventListener", "on"]:
                features["eventHandlingChange"] = 1
                
    if t in ["JSXElement", "JSXOpeningElement"]:
        features["uiChange"] = 1
        if t == "JSXOpeningElement":
            name = getattr(node, "name", None)
            if name and name.type == "JSXIdentifier":
                if name.name in ["Link", "Route", "Router", "NavLink", "Navigate"]:
                    features["routingChange"] = 1
            
            attributes = getattr(node, "attributes", [])
            for attr in attributes:
                if attr.type == "JSXAttribute":
                    attr_name = getattr(attr, "name", None)
                    if attr_name and attr_name.type == "JSXIdentifier":
                        if attr_name.name.startswith("on"):
                            features["eventHandlingChange"] = 1

    for key, value in vars(node).items():
        if isinstance(value, esprima.nodes.Node):
            traverse_ast(value, features)
        elif isinstance(value, list):
            for item in value:
                if isinstance(item, esprima.nodes.Node):
                    traverse_ast(item, features)


def get_ast_features(patch):
    if esprima is None:
        return None
    added_code = extract_added_lines(patch)
    if not added_code.strip():
        return None
        
    ast = None
    try:
        ast = esprima.parseScript(added_code, jsx=True)
    except Exception:
        try:
            ast = esprima.parseScript("function __wrapper__() {\n" + added_code + "\n}", jsx=True)
        except Exception:
            return None
            
    if ast:
        features = {
            "changedFunctions": 0,
            "changedVariables": 0,
            "businessLogic": 0,
            "stateChange": 0,
            "uiChange": 0,
            "apiChange": 0,
            "routingChange": 0,
            "eventHandlingChange": 0
        }
        traverse_ast(ast, features)
        return features
    return None


def calculate_features(record):
    files = record.get("files", [])

    target_files = [
        file for file in files
        if file.get("language", "").lower()
        in ["javascript", "typescript", "css", "scss", "sass", "less"]
    ]

    if not target_files:
        return None

    changed_lines = 0
    added_lines = 0
    removed_lines = 0
    has_js = False
    has_css = False
    
    ast_success_count = 0
    ast_fallback_count = 0
    
    ast_features = {
        "changedFunctions": 0,
        "changedVariables": 0,
        "businessLogic": 0,
        "stateChange": 0,
        "uiChange": 0,
        "apiChange": 0,
        "routingChange": 0,
        "eventHandlingChange": 0
    }

    combined_patch = ""

    for file in target_files:
        lang = file.get("language", "").lower()
        if lang in ["javascript", "typescript"]:
            has_js = True
        if lang in ["css", "scss", "sass", "less"]:
            has_css = True

        additions = file.get("additions", 0) or 0
        deletions = file.get("deletions", 0) or 0

        added_lines += additions
        removed_lines += deletions
        changed_lines += additions + deletions
        
        patch = file.get("patch", "")
        combined_patch += " " + patch
        
        if lang in ["javascript", "typescript"]:
            feat = get_ast_features(patch)
            if feat:
                ast_success_count += 1
                ast_features["changedFunctions"] += feat["changedFunctions"]
                ast_features["changedVariables"] += feat["changedVariables"]
                ast_features["businessLogic"] |= feat["businessLogic"]
                ast_features["stateChange"] |= feat["stateChange"]
                ast_features["uiChange"] |= feat["uiChange"]
                ast_features["apiChange"] |= feat["apiChange"]
                ast_features["routingChange"] |= feat["routingChange"]
                ast_features["eventHandlingChange"] |= feat["eventHandlingChange"]
            else:
                ast_fallback_count += 1

    message = record.get("message", "").lower()
    combined_text = (message + " " + combined_patch).lower()

    # Fallback / existing keyword logic
    business_logic = int(any(w in combined_text for w in ["calculate", "validation", "validate", "price", "total", "amount", "permission", "authentication", "authorization"]))
    state_change = int(any(w in combined_text for w in ["setstate", "usestate", "dispatch", "reducer", "store"]))
    ui_change = int(any(w in combined_text for w in ["component", "render", "jsx", "button", "input", "form"]))
    api_change = int(any(w in combined_text for w in ["api", "fetch(", "axios", "request", "response"]))
    routing_change = int(any(w in combined_text for w in ["router", "route", "navigation"]))
    event_handling_change = int(any(w in combined_text for w in ["onclick", "onchange", "onsubmit", "event"]))
    changed_functions = combined_text.count("function ")
    changed_variables = combined_text.count("const ") + combined_text.count("let ") + combined_text.count("var ")
    
    # Merge AST and Regex logic
    final_changedFunctions = changed_functions
    final_changedVariables = changed_variables
    if ast_success_count > 0:
        final_changedFunctions = ast_features["changedFunctions"] + (changed_functions if ast_fallback_count > 0 else 0)
        final_changedVariables = ast_features["changedVariables"] + (changed_variables if ast_fallback_count > 0 else 0)
    
    final_businessLogic = business_logic | (ast_features["businessLogic"] if ast_success_count > 0 else 0)
    final_stateChange = state_change | (ast_features["stateChange"] if ast_success_count > 0 else 0)
    final_uiChange = ui_change | (ast_features["uiChange"] if ast_success_count > 0 else 0)
    final_apiChange = api_change | (ast_features["apiChange"] if ast_success_count > 0 else 0)
    final_routingChange = routing_change | (ast_features["routingChange"] if ast_success_count > 0 else 0)
    final_eventHandlingChange = event_handling_change | (ast_features["eventHandlingChange"] if ast_success_count > 0 else 0)

    styling_change = int(any(w in combined_text for w in ["css", "style", "layout", "color", "margin", "padding", "font", "display", "position", "width", "height", "background", "border"]))

    direct_dependencies = combined_text.count("import ") + combined_text.count("require(")
    indirect_dependencies = 0
    total_dependencies = direct_dependencies + indirect_dependencies

    is_javascript = 1 if has_js else 0
    is_css = 1 if has_css else 0

    return {
        "changedLines": changed_lines,
        "addedLines": added_lines,
        "removedLines": removed_lines,

        "changedFunctions": final_changedFunctions,
        "changedVariables": final_changedVariables,

        "directDependencies": direct_dependencies,
        "indirectDependencies": indirect_dependencies,
        "totalDependencies": total_dependencies,

        "businessLogic": final_businessLogic,
        "stateChange": final_stateChange,
        "uiChange": final_uiChange,
        "apiChange": final_apiChange,
        "routingChange": final_routingChange,
        "stylingChange": styling_change,
        "eventHandlingChange": final_eventHandlingChange,

        "isJavaScript": is_javascript,
        "isCSS": is_css,

        "riskLevel": calculate_risk_level(
            changed_lines,
            added_lines,
            removed_lines,
            final_changedFunctions,
            final_businessLogic,
            final_stateChange,
            final_apiChange,
            direct_dependencies,
            indirect_dependencies
        ),
        "_stats": {
            "ast_success": ast_success_count,
            "ast_fallback": ast_fallback_count,
            "old_funcs": changed_functions,
            "old_vars": changed_variables,
            "old_biz": business_logic,
            "old_state": state_change,
            "old_ui": ui_change,
            "old_api": api_change,
            "old_route": routing_change,
            "old_event": event_handling_change
        }
    }

def main():
    print("Loading dataset...")
    dataset = load_dataset(DATASET_NAME, split="train")
    print(f"Total records: {len(dataset)}")

    MAX_PER_CLASS = 3000
    samples_by_risk = {"LOW": [], "MEDIUM": [], "HIGH": []}

    processed = 0
    javascript_records = 0
    
    total_success = 0
    total_fallback = 0
    diff_stats = {
        "funcs": 0, "vars": 0, "biz": 0, "state": 0,
        "ui": 0, "api": 0, "route": 0, "event": 0
    }

    for record in dataset:
        processed += 1
        features = calculate_features(record)
        if features is None:
            continue

        javascript_records += 1
        
        stats = features.pop("_stats")
        total_success += stats["ast_success"]
        total_fallback += stats["ast_fallback"]
        
        if features["changedFunctions"] != stats["old_funcs"]: diff_stats["funcs"] += 1
        if features["changedVariables"] != stats["old_vars"]: diff_stats["vars"] += 1
        if features["businessLogic"] != stats["old_biz"]: diff_stats["biz"] += 1
        if features["stateChange"] != stats["old_state"]: diff_stats["state"] += 1
        if features["uiChange"] != stats["old_ui"]: diff_stats["ui"] += 1
        if features["apiChange"] != stats["old_api"]: diff_stats["api"] += 1
        if features["routingChange"] != stats["old_route"]: diff_stats["route"] += 1
        if features["eventHandlingChange"] != stats["old_event"]: diff_stats["event"] += 1

        risk = features["riskLevel"]

        if risk in samples_by_risk and len(samples_by_risk[risk]) < MAX_PER_CLASS:
            samples_by_risk[risk].append(features)

        if all(len(samples_by_risk[r]) >= MAX_PER_CLASS for r in samples_by_risk):
            break

        if processed % 5000 == 0:
            print(f"Processed: {processed}")

    samples = samples_by_risk["LOW"] + samples_by_risk["MEDIUM"] + samples_by_risk["HIGH"]

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as file:
        json.dump(samples, file, indent=2)

    print("\nDataset preparation completed!")
    print(f"Records processed: {processed}")
    print(f"JavaScript/TypeScript records: {javascript_records}")
    print(f"LOW samples: {len(samples_by_risk['LOW'])}")
    print(f"MEDIUM samples: {len(samples_by_risk['MEDIUM'])}")
    print(f"HIGH samples: {len(samples_by_risk['HIGH'])}")
    print(f"Total training samples: {len(samples)}")
    print(f"Saved to: {OUTPUT_FILE}")
    
    print("\n--- AST STATISTICS ---")
    print(f"AST Success (files parsed): {total_success}")
    print(f"AST Fallback (parse failed): {total_fallback}")
    print("Samples changed vs pure regex:")
    print(f" - changedFunctions: {diff_stats['funcs']}")
    print(f" - changedVariables: {diff_stats['vars']}")
    print(f" - businessLogic: {diff_stats['biz']}")
    print(f" - stateChange: {diff_stats['state']}")
    print(f" - uiChange: {diff_stats['ui']}")
    print(f" - apiChange: {diff_stats['api']}")
    print(f" - routingChange: {diff_stats['route']}")
    print(f" - eventHandlingChange: {diff_stats['event']}")

if __name__ == "__main__":
    main()

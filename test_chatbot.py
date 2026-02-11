#!/usr/bin/env python3
"""
Chatbot Verification Test Script
Tests that the chatbot returns dynamic, data-backed responses.
"""

import requests
import json
import sys

BASE_URL = "http://localhost:8000"

# Test cases: different questions should return different, data-backed answers
TEST_CASES = [
    {
        "name": "Resume Count",
        "query": "How many resumes do you have?",
        "expect_in_response": ["226", "resumes", "database"],
    },
    {
        "name": "List Cities",
        "query": "List all cities",
        "expect_in_response": ["Ahmedabad", "Anand", "Gandhinagar", "Total unique cities"], 
    },
    {
        "name": "List Candidates",
        "query": "List all candidate names",
        "expect_in_response": ["1.", "2."],  # Should have numbered list
    },
    {
        "name": "Skill Search - Python",
        "query": "Who has Python skills?",
        "expect_in_response": ["Python", "Context", "Answer"],
    },
    {
        "name": "Experience Query",
        "query": "Tell me about the most experienced candidate",
        "expect_in_response": ["Context", "Answer", "experience"],
    },
    {
        "name": "Different Question",
        "query": "What skills are most common?",
        "expect_in_response": ["skill", "Context", "Answer"],
    }
]


def test_chat_endpoint():
    """Test the chat endpoint with various questions."""
    print("\n" + "="*60)
    print("🧪 CHATBOT VERIFICATION TEST")
    print("="*60 + "\n")
    
    # First check if server is running
    try:
        requests.get(f"{BASE_URL}/docs", timeout=5)
    except requests.exceptions.ConnectionError:
        print("❌ ERROR: Backend server not running!")
        print("   Start it with: cd Backend && python -m uvicorn app.main:app --reload --port 8000")
        return False
    
    passed = 0
    failed = 0
    responses = []
    
    for i, test in enumerate(TEST_CASES, 1):
        print(f"\n📌 Test {i}: {test['name']}")
        print(f"   Query: \"{test['query']}\"")
        
        try:
            response = requests.post(
                f"{BASE_URL}/chat",
                json={"query": test["query"], "user_id": "test_user"},
                timeout=30
            )
            
            if response.status_code != 200:
                print(f"   ❌ FAILED: HTTP {response.status_code}")
                failed += 1
                continue
            
            data = response.json()
            reply = data.get("reply", "")
            
            # Check for expected content
            missing = []
            for expected in test["expect_in_response"]:
                if expected.lower() not in reply.lower():
                    missing.append(expected)
            
            if missing:
                print(f"   ⚠️ WARNING: Missing expected content: {missing}")
            
            # Check response is not empty
            if len(reply) < 50:
                print(f"   ❌ FAILED: Response too short ({len(reply)} chars)")
                failed += 1
            else:
                print(f"   ✅ PASSED: Response length {len(reply)} chars")
                print(f"   Preview: {reply[:150]}...")
                passed += 1
            
            responses.append(reply)
            
        except Exception as e:
            print(f"   ❌ ERROR: {e}")
            failed += 1
    
    # Check uniqueness of responses
    print("\n" + "="*60)
    print("📊 UNIQUENESS CHECK")
    print("="*60)
    
    unique_responses = len(set(responses))
    if unique_responses == len(responses):
        print(f"✅ All {len(responses)} responses are UNIQUE")
    else:
        print(f"⚠️ Only {unique_responses}/{len(responses)} responses are unique")
    
    # Summary
    print("\n" + "="*60)
    print("📋 TEST SUMMARY")
    print("="*60)
    print(f"   Passed: {passed}")
    print(f"   Failed: {failed}")
    print(f"   Total:  {len(TEST_CASES)}")
    
    if failed == 0:
        print("\n✅ ALL TESTS PASSED! Chatbot is working correctly.")
        return True
    else:
        print(f"\n⚠️ {failed} test(s) failed. Check the logs above.")
        return False


if __name__ == "__main__":
    success = test_chat_endpoint()
    sys.exit(0 if success else 1)
